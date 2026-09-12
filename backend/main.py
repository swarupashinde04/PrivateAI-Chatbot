from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import re
import json
import urllib.request
import urllib.error
import os
import tempfile
from faster_whisper import WhisperModel
from pypdf import PdfReader
from docx import Document


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="PrivateAI Gateway",
    description="Privacy-first local AI gateway",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOCAL PRIVATE MEMORY
# =========================================================

# Prototype storage.
# Private values stay inside the local backend memory.
# NOTE: This is RAM-based and will reset when the backend
# restarts.

private_memory = {}


# =========================================================
# TOKEN COUNTERS
# =========================================================

token_counters = {
    "EMAIL": 0,
    "PHONE": 0,
    "AADHAAR": 0,
    "SALARY": 0,
}


# =========================================================
# PENDING PERMISSION
# =========================================================

pending_permission = None


# =========================================================
# AUDIT LOG
# =========================================================

audit_logs = []


def add_audit_event(
    event: str,
    details: str = "",
    severity: str = "INFO",
):
    """
    Store a local security/audit event.
    """

    audit_logs.insert(
        0,
        {
            "time": datetime.now().strftime("%H:%M:%S"),
            "event": event,
            "details": details,
            "severity": severity,
        },
    )

    # Keep only the latest 100 events
    if len(audit_logs) > 100:
        del audit_logs[100:]


# =========================================================
# REQUEST MODELS
# =========================================================

class PromptRequest(BaseModel):
    text: str


class MemoryRequest(BaseModel):
    query: str


class DecisionRequest(BaseModel):
    query: str


class PermissionRequest(BaseModel):
    query: str


class PermissionGrantRequest(BaseModel):
    decision: str


class ChatRequest(BaseModel):
    text: str


# =========================================================
# TOKEN CREATION
# =========================================================

def get_or_create_token(
    value: str,
    data_type: str,
):
    """
    Create a stable token for a private value.

    The real value remains inside private_memory.
    """

    if value in private_memory:
        return private_memory[value]["token"]

    token_counters[data_type] += 1

    token = f"{data_type}_{token_counters[data_type]}"

    private_memory[value] = {
        "token": token,
        "type": data_type,
        "value": value,
    }

    return token


# =========================================================
# PHONE NORMALIZATION
# =========================================================

def normalize_phone(value: str) -> str:
    """
    Normalize Indian phone numbers.
    """

    digits = re.sub(
        r"\D",
        "",
        value,
    )

    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]

    return digits


# =========================================================
# LOCAL PRIVACY ANALYZER
# =========================================================

def analyze_and_protect(text: str):

    safe_text = text
    detected_data = []

    # =====================================================
    # EMAIL
    # =====================================================

    email_pattern = (
        r"\b"
        r"[A-Za-z0-9._%+-]+"
        r"@"
        r"[A-Za-z0-9.-]+"
        r"\."
        r"[A-Za-z]{2,}"
        r"\b"
    )

    emails = re.findall(
        email_pattern,
        text,
    )

    for email in emails:

        token = get_or_create_token(
            email,
            "EMAIL",
        )

        safe_text = safe_text.replace(
            email,
            token,
        )

        detected_data.append(
            {
                "type": "EMAIL",
                "token": token,
            }
        )

    # =====================================================
    # PHONE
    # =====================================================

    phone_pattern = (
        r"(?<!\d)"
        r"(?:\+91[\s-]?)?"
        r"[6-9]\d{9}"
        r"(?!\d)"
    )

    phones = re.findall(
        phone_pattern,
        text,
    )

    for phone in phones:

        normalized_phone = normalize_phone(
            phone
        )

        token = get_or_create_token(
            normalized_phone,
            "PHONE",
        )

        safe_text = safe_text.replace(
            phone,
            token,
        )

        detected_data.append(
            {
                "type": "PHONE",
                "token": token,
            }
        )

    # =====================================================
    # AADHAAR
    # =====================================================

    aadhaar_pattern = (
        r"(?<!\d)"
        r"\d{4}[\s-]?\d{4}[\s-]?\d{4}"
        r"(?!\d)"
    )

    aadhaars = re.findall(
        aadhaar_pattern,
        text,
    )

    for aadhaar in aadhaars:

        normalized_aadhaar = re.sub(
            r"[\s-]",
            "",
            aadhaar,
        )

        token = get_or_create_token(
            normalized_aadhaar,
            "AADHAAR",
        )

        safe_text = safe_text.replace(
            aadhaar,
            token,
        )

        detected_data.append(
            {
                "type": "AADHAAR",
                "token": token,
            }
        )

    # =====================================================
    # SALARY / INCOME
    # =====================================================
    #
    # Examples:
    #
    # My salary is 75000
    # My salary is ₹75,000
    # salary: 75000
    # income is 75000
    # salary of Rs. 75000
    #
    # Only the numeric value is replaced.
    # =====================================================

    salary_pattern = (
        r"(?i)"
        r"(?:salary|income)"
        r"\s*"
        r"(?:is|of|:)?"
        r"\s*"
        r"(?:₹|rs\.?|inr)?"
        r"\s*"
        r"([0-9][0-9,]*)"
    )

    # Use regex substitution instead of string indexes.
    # Earlier EMAIL/PHONE/AADHAAR replacements can change the length
    # of safe_text, so original match indexes must not be reused.
    def replace_salary(match):

        actual_salary = match.group(1)

        normalized_salary = actual_salary.replace(
            ",",
            "",
        )

        token = get_or_create_token(
            normalized_salary,
            "SALARY",
        )

        detected_data.append(
            {
                "type": "SALARY",
                "token": token,
            }
        )

        # Keep the original wording/currency and replace only the
        # sensitive numeric salary value.
        return match.group(0)[:match.start(1) - match.start()] + token

    safe_text = re.sub(
        salary_pattern,
        replace_salary,
        safe_text,
    )

    # =====================================================
    # AUDIT ANALYSIS
    # =====================================================

    if detected_data:

        detected_types = ", ".join(
            sorted(
                set(
                    item["type"]
                    for item in detected_data
                )
            )
        )

        add_audit_event(
            "Request analyzed",
            (
                f"Sensitive data detected: "
                f"{detected_types}. "
                f"Private values protected locally."
            ),
            "SECURITY",
        )

    else:

        add_audit_event(
            "Request analyzed",
            "No sensitive personal data detected.",
            "INFO",
        )

    return {
        "safe_prompt": safe_text,
        "detected_data": detected_data,
        "privacy_status": (
            "Sensitive data protected locally"
            if detected_data
            else "No sensitive data detected"
        ),
    }


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "status": "PrivateAI Gateway running",
        "privacy_mode": "local-first",
        "cloud_access": False,
    }


# =========================================================
# ANALYZE
# =========================================================

@app.post("/analyze")
def analyze(request: PromptRequest):

    return analyze_and_protect(
        request.text
    )


# =========================================================
# MEMORY STATUS
# =========================================================

@app.get("/memory/status")
def memory_status():

    return {
        "protected": True,
        "stored_items": len(private_memory),
        "cloud_access": False,
        "storage": "LOCAL RAM",
    }


# =========================================================
# MEMORY RETRIEVE
# =========================================================

@app.post("/memory/retrieve")
def retrieve_memory(
    request: MemoryRequest
):

    query = request.query.lower()

    found_items = []

    # =====================================================
    # INTENT DETECTION
    # =====================================================

    wants_phone = any(
        word in query
        for word in [
            "phone",
            "mobile",
            "number",
            "contact",
        ]
    )

    wants_email = any(
        word in query
        for word in [
            "email",
            "mail",
        ]
    )

    wants_aadhaar = any(
        word in query
        for word in [
            "aadhaar",
            "aadhar",
            "uid",
        ]
    )

    wants_salary = any(
        word in query
        for word in [
            "salary",
            "income",
            "pay",
        ]
    )

    # =====================================================
    # SEARCH LOCAL MEMORY
    # =====================================================

    for item in private_memory.values():

        item_type = item["type"]

        if (
            wants_phone
            and item_type == "PHONE"
        ):
            found_items.append(item)

        elif (
            wants_email
            and item_type == "EMAIL"
        ):
            found_items.append(item)

        elif (
            wants_aadhaar
            and item_type == "AADHAAR"
        ):
            found_items.append(item)

        elif (
            wants_salary
            and item_type == "SALARY"
        ):
            found_items.append(item)

    # =====================================================
    # AUDIT
    # =====================================================

    if found_items:

        add_audit_event(
            "Local memory retrieved",
            (
                f"{len(found_items)} protected "
                f"item(s) retrieved locally."
            ),
            "SECURITY",
        )

    else:

        add_audit_event(
            "Local memory lookup",
            "No matching private memory found.",
            "INFO",
        )

    return {
        "found": bool(found_items),
        "items": found_items,
        "source": "LOCAL PRIVATE MEMORY",
    }


# =========================================================
# ROUTING DECISION
# =========================================================

@app.post("/decide")
def decide(
    request: DecisionRequest
):

    query = request.query.lower()

    # =====================================================
    # LOCAL PRIVATE MEMORY QUESTIONS
    # =====================================================

    local_patterns = [
        "what is my phone",
        "what's my phone",
        "what is my mobile",
        "what's my mobile",
        "my phone number",
        "my mobile number",
        "what is my email",
        "what's my email",
        "my email address",
        "what is my aadhaar",
        "what's my aadhaar",
        "my aadhaar number",
        "what is my aadhar",
        "what's my aadhar",
    ]

    local_route = any(
        pattern in query
        for pattern in local_patterns
    )

    # =====================================================
    # LOCAL
    # =====================================================

    if local_route:

        add_audit_event(
            "Request routed to LOCAL",
            (
                "Request can be answered from "
                "protected local memory."
            ),
            "SECURITY",
        )

        return {
            "route": "LOCAL",
            "reason": (
                "Request concerns private local memory."
            ),
        }

    # =====================================================
    # CLOUD
    # =====================================================

    add_audit_event(
        "Request routed to CLOUD",
        "Request requires cloud reasoning.",
        "INFO",
    )

    return {
        "route": "CLOUD",
        "reason": (
            "Request requires general AI reasoning."
        ),
    }


# =========================================================
# PERMISSION REQUEST
# =========================================================

@app.post("/permission/request")
def permission_request(
    request: PermissionRequest
):

    global pending_permission

    query = request.query.lower()

    # =====================================================
    # COMPARISON / ANALYSIS
    # =====================================================
    #
    # Example:
    #
    # How does my salary compare with the industry average?
    #
    # Exact salary is NOT necessary.
    # =====================================================

    comparison_keywords = [
        "compare",
        "comparison",
        "average salary",
        "industry average",
        "market average",
        "benchmark",
        "benchmarking",
        "salary range",
        "income range",
        "how does my salary",
        "how does my income",
    ]

    is_comparison = any(
        keyword in query
        for keyword in comparison_keywords
    )

    if is_comparison:

        pending_permission = None

        add_audit_event(
            "Minimum disclosure approved",
            (
                "Comparison can be performed "
                "without exposing the exact "
                "private salary."
            ),
            "SECURITY",
        )

        return {
            "permission_required": False,
            "disclosure_level": "minimum",
            "message": (
                "Exact salary is not required. "
                "The gateway will use minimum "
                "necessary context."
            ),
        }

    # =====================================================
    # EXACT SALARY REQUEST
    # =====================================================
    #
    # IMPORTANT:
    #
    # "My salary is 75000"
    #
    # MUST NOT match these patterns.
    #
    # Only actual questions/requests for the
    # salary should trigger permission.
    # =====================================================

    exact_salary_keywords = [
        "exact salary",
        "what is my salary",
        "what's my salary",
        "tell me my salary",
        "show me my salary",
        "give me my salary",
        "salary amount",
        "what is my income",
        "what's my income",
        "tell me my income",
        "show me my income",
        "give me my income",
    ]

    wants_exact_salary = any(
        keyword in query
        for keyword in exact_salary_keywords
    )

    if wants_exact_salary:

        salary_items = [
            item
            for item in private_memory.values()
            if item["type"] == "SALARY"
        ]

        # =================================================
        # SALARY EXISTS
        # =================================================

        if salary_items:

            salary_item = salary_items[-1]

            pending_permission = {
                "type": "SALARY",
                "token": salary_item["token"],
                "purpose": request.query,
            }

            add_audit_event(
                "Cloud disclosure requested",
                (
                    "Exact salary requires "
                    "explicit user permission."
                ),
                "WARNING",
            )

            return {
                "permission_required": True,
                "data_type": "SALARY",
                "purpose": request.query,
                "message": (
                    "The exact salary is stored locally. "
                    "Explicit permission is required "
                    "before disclosure."
                ),
                "options": [
                    "SHARE_ONCE",
                    "DENY",
                ],
            }

        # =================================================
        # NO SALARY
        # =================================================

        add_audit_event(
            "Private data not found",
            (
                "No local salary is available "
                "for disclosure."
            ),
            "INFO",
        )

        return {
            "permission_required": False,
            "disclosure_level": "none",
            "message": (
                "No salary information is stored "
                "in local memory."
            ),
        }

    # =====================================================
    # DEFAULT PROTECTION
    # =====================================================

    pending_permission = None

    add_audit_event(
        "Private data protected",
        (
            "No exact private value is required "
            "for this request."
        ),
        "SECURITY",
    )

    return {
        "permission_required": False,
        "disclosure_level": "protected",
        "message": (
            "Private information remains protected."
        ),
    }


# =========================================================
# PERMISSION GRANT
# =========================================================

@app.post("/permission/grant")
def grant_permission(
    request: PermissionGrantRequest
):

    global pending_permission

    decision = request.decision.upper()

    # =====================================================
    # DENY
    # =====================================================

    if decision == "DENY":

        pending_permission = None

        add_audit_event(
            "Disclosure denied",
            (
                "User denied access to "
                "private information."
            ),
            "SECURITY",
        )

        return {
            "approved": False,
            "cloud_access": False,
            "message": (
                "Private information was not disclosed."
            ),
        }

    # =====================================================
    # SHARE ONCE
    # =====================================================

    if decision == "SHARE_ONCE":

        if not pending_permission:

            add_audit_event(
                "Invalid disclosure attempt",
                (
                    "No pending permission request exists."
                ),
                "WARNING",
            )

            return {
                "approved": False,
                "cloud_access": False,
                "message": (
                    "No pending permission request."
                ),
            }

        token = pending_permission["token"]

        matching_item = None

        for item in private_memory.values():

            if item["token"] == token:

                matching_item = item
                break

        if not matching_item:

            pending_permission = None

            add_audit_event(
                "Disclosure failed",
                (
                    "Requested private item no "
                    "longer exists in local memory."
                ),
                "WARNING",
            )

            return {
                "approved": False,
                "cloud_access": False,
                "message": (
                    "Private information could "
                    "not be located."
                ),
            }

        # =================================================
        # PROTOTYPE ONLY
        # =================================================
        #
        # The raw value is returned here only to
        # demonstrate the one-time permission flow.
        #
        # Production implementation should use a
        # controlled disclosure channel instead of
        # returning raw private values directly.
        # =================================================

        shared_value = matching_item["value"]
        data_type = matching_item["type"]

        pending_permission = None

        add_audit_event(
            "One-time disclosure approved",
            (
                f"{data_type} approved "
                f"for this request only."
            ),
            "SECURITY",
        )

        return {
            "approved": True,
            "cloud_access": True,
            "one_time": True,
            "data_type": data_type,
            "shared_value": shared_value,
            "message": (
                "One-time disclosure approved."
            ),
        }

    # =====================================================
    # INVALID DECISION
    # =====================================================

    add_audit_event(
        "Invalid permission decision",
        f"Unsupported decision: {decision}",
        "WARNING",
    )

    return {
        "approved": False,
        "cloud_access": False,
        "message": (
            "Invalid permission decision."
        ),
    }


# =========================================================
# DISCLOSURE PLAN
# =========================================================

@app.post("/disclosure/plan")
def disclosure_plan(
    request: PermissionRequest
):

    query = request.query.lower()

    # =====================================================
    # CHECK SALARY
    # =====================================================

    salary_items = [
        item
        for item in private_memory.values()
        if item["type"] == "SALARY"
    ]

    # =====================================================
    # NO SALARY
    # =====================================================

    if not salary_items:

        add_audit_event(
            "Disclosure plan created",
            (
                "No private salary data is "
                "stored locally."
            ),
            "INFO",
        )

        return {
            "disclosure_level": "none",
            "exact_value": False,
            "cloud_data": (
                "No private information is required."
            ),
            "local_action": (
                "No action required."
            ),
        }

    # =====================================================
    # COMPARISON
    # =====================================================

    comparison_keywords = [
        "compare",
        "comparison",
        "average salary",
        "industry average",
        "market average",
        "benchmark",
        "benchmarking",
        "salary range",
        "income range",
        "how does my salary",
        "how does my income",
    ]

    is_comparison = any(
        keyword in query
        for keyword in comparison_keywords
    )

    if is_comparison:

        add_audit_event(
            "Disclosure plan created",
            (
                "Minimum disclosure: exact salary "
                "remains local."
            ),
            "SECURITY",
        )

        return {
            "disclosure_level": "minimum",
            "exact_value": False,
            "cloud_data": (
                "Perform the requested comparison "
                "without exposing the user's "
                "exact salary."
            ),
            "local_action": (
                "Calculate or transform the private "
                "salary locally before any cloud "
                "disclosure."
            ),
        }

    # =====================================================
    # EXACT SALARY REQUEST
    # =====================================================

    exact_salary_keywords = [
        "exact salary",
        "what is my salary",
        "what's my salary",
        "tell me my salary",
        "show me my salary",
        "give me my salary",
        "salary amount",
        "what is my income",
        "what's my income",
        "tell me my income",
        "show me my income",
        "give me my income",
    ]

    wants_exact_salary = any(
        keyword in query
        for keyword in exact_salary_keywords
    )

    if wants_exact_salary:

        add_audit_event(
            "Disclosure plan created",
            (
                "Exact salary disclosure requested."
            ),
            "WARNING",
        )

        return {
            "disclosure_level": "exact",
            "exact_value": True,
            "cloud_data": (
                "Exact salary requires "
                "explicit permission."
            ),
            "local_action": (
                "Keep exact salary inside local "
                "memory until permission is granted."
            ),
        }

    # =====================================================
    # DEFAULT PROTECTED
    # =====================================================

    add_audit_event(
        "Disclosure plan created",
        (
            "Private data remains protected; "
            "exact value not required."
        ),
        "SECURITY",
    )

    return {
        "disclosure_level": "protected",
        "exact_value": False,
        "cloud_data": (
            "No exact private value disclosed."
        ),
        "local_action": (
            "Keep private information "
            "in local memory."
        ),
    }




# =========================================================
# LOCAL WHISPER STT
# =========================================================

# Whisper runs entirely on the local machine.
# "base" is a practical CPU-friendly starting model.
WHISPER_MODEL = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8",
)


# =========================================================
# LOCAL GEMMA 3 CHAT
# =========================================================

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "gemma3:latest"


def ask_local_gemma(user_prompt: str, system_prompt: str = ""):
    """Call the locally running Ollama/Gemma model."""
    messages = []

    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    messages.append({"role": "user", "content": user_prompt})

    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))

        return data.get("message", {}).get(
            "content",
            "I could not generate a response."
        )

    except urllib.error.URLError as exc:
        add_audit_event(
            "Local AI unavailable",
            f"Ollama request failed: {exc}",
            "ERROR",
        )
        return (
            "The local AI model is unavailable. "
            "Please make sure Ollama is running."
        )

    except Exception as exc:
        add_audit_event(
            "Local AI error",
            f"Unexpected Ollama error: {exc}",
            "ERROR",
        )
        return "The local AI gateway encountered an unexpected error."


def get_salary_band(salary: int) -> str:
    """Convert exact salary to a coarse range locally."""
    if salary < 30000:
        return "below ₹30,000 per month"
    if salary < 50000:
        return "₹30,000–₹49,999 per month"
    if salary < 75000:
        return "₹50,000–₹74,999 per month"
    if salary < 100000:
        return "₹75,000–₹99,999 per month"
    if salary < 150000:
        return "₹1,00,000–₹1,49,999 per month"
    return "₹1,50,000+ per month"



# =========================================================
# INTERNAL TOKEN SAFETY
# =========================================================

def remove_internal_tokens(value: str) -> str:
    """Hide implementation tokens from both the model and the UI."""
    if not value:
        return value

    replacements = [
        (r"\bSALARY_\d+\b", "your private salary"),
        (r"\bPHONE_\d+\b", "your private phone number"),
        (r"\bEMAIL_\d+\b", "your private email address"),
        (r"\bAADHAAR_\d+\b", "your private Aadhaar number"),
    ]

    cleaned = value
    for pattern, replacement in replacements:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    return cleaned.strip()


def sanitize_model_answer(value: str) -> str:
    """Final defense layer before an answer reaches the frontend."""
    return remove_internal_tokens(value or "")


# =========================================================
# LOCAL VOICE TRANSCRIPTION
# =========================================================

@app.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """
    Transcribe uploaded audio locally with Whisper.

    Audio is written only to a temporary local file,
    transcribed locally, and deleted after processing.
    No external speech-to-text API is used.
    """

    temp_path = None

    try:
        suffix = os.path.splitext(file.filename or "")[1] or ".webm"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:
            temp_path = temp_file.name
            temp_file.write(await file.read())

        segments, info = WHISPER_MODEL.transcribe(
            temp_path,
            beam_size=5,
        )

        transcript = " ".join(
            segment.text.strip()
            for segment in segments
            if segment.text.strip()
        ).strip()

        add_audit_event(
            "Voice transcribed locally",
            f"Detected language: {info.language}",
            "SECURITY",
        )

        return {
            "status": "success",
            "transcript": transcript,
            "language": info.language,
            "language_probability": info.language_probability,
            "route": "LOCAL_WHISPER",
            "privacy_status": "AUDIO PROCESSED LOCALLY",
        }

    except Exception as exc:
        add_audit_event(
            "Voice transcription failed",
            str(exc),
            "ERROR",
        )

        return {
            "status": "error",
            "response": "Voice transcription failed.",
            "detail": str(exc),
            "route": "LOCAL_WHISPER",
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


# =========================================================
# LOCAL FILE ATTACHMENTS
# =========================================================

ALLOWED_ATTACHMENT_TYPES = {"pdf", "docx", "txt"}
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024  # 10 MB


def extract_attachment_text(file_path: str, extension: str) -> str:
    """Extract text from supported document types locally."""
    extension = extension.lower().lstrip(".")

    if extension == "txt":
        for encoding in ("utf-8", "utf-8-sig", "cp1252"):
            try:
                with open(file_path, "r", encoding=encoding) as handle:
                    return handle.read()
            except UnicodeDecodeError:
                continue
        raise ValueError("Could not decode the text file.")

    if extension == "pdf":
        reader = PdfReader(file_path)
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages).strip()

    if extension == "docx":
        document = Document(file_path)
        parts = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
        for table in document.tables:
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                if any(cells):
                    parts.append(" | ".join(cells))
        return "\n".join(parts).strip()

    raise ValueError("Unsupported attachment type.")


@app.post("/attachment/analyze")
async def analyze_attachment(file: UploadFile = File(...)):
    """Process a PDF, DOCX, or TXT attachment entirely on the local gateway."""
    filename = file.filename or "attachment"
    extension = os.path.splitext(filename)[1].lower().lstrip(".")

    if extension not in ALLOWED_ATTACHMENT_TYPES:
        return {
            "status": "error",
            "message": "Supported attachment types are PDF, DOCX, and TXT.",
        }

    temp_path = None

    try:
        content = await file.read()

        if len(content) > MAX_ATTACHMENT_SIZE:
            return {
                "status": "error",
                "message": "Attachment is too large. Maximum size is 10 MB.",
            }

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}") as temp_file:
            temp_path = temp_file.name
            temp_file.write(content)

        extracted_text = extract_attachment_text(temp_path, extension)

        if not extracted_text.strip():
            return {
                "status": "error",
                "message": "No readable text was found in the attachment.",
            }

        # Reuse the same local privacy analyzer used by chat requests.
        analysis = analyze_and_protect(extracted_text)

        add_audit_event(
            "Attachment processed locally",
            (
                f"{filename} ({extension.upper()}) extracted and privacy-scanned. "
                f"Detected {len(analysis['detected_data'])} sensitive item(s)."
            ),
            "SECURITY",
        )

        return {
            "status": "success",
            "filename": filename,
            "file_type": extension.upper(),
            "text_length": len(extracted_text),
            "safe_text": analysis["safe_prompt"],
            "detected_data": analysis["detected_data"],
            "privacy_status": analysis["privacy_status"],
            "processing": "LOCAL ONLY",
            "message": "File extracted and privacy-scanned locally. Exact sensitive values remain in local memory.",
        }

    except Exception as exc:
        add_audit_event(
            "Attachment processing failed",
            f"{filename}: {exc}",
            "ERROR",
        )
        return {
            "status": "error",
            "message": "The attachment could not be processed.",
            "detail": str(exc),
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


@app.post("/chat")
def chat(request: ChatRequest):
    """
    Main conversational endpoint.

    Privacy policy is enforced before Gemma receives context.
    The exact private value remains inside the local gateway.
    """

    query = request.text.strip()

    if not query:
        return {
            "status": "error",
            "response": "Please enter a message.",
        }

    # =====================================================
    # 1. LOCAL PRIVACY ANALYSIS
    # =====================================================

    analysis = analyze_and_protect(query)
    safe_prompt = analysis["safe_prompt"]
    detected_data = analysis["detected_data"]

    # =====================================================
    # 2. LOCAL ROUTING DECISION
    # =====================================================

    decision = decide(DecisionRequest(query=query))

    # =====================================================
    # 3. LOCAL MEMORY REQUEST
    # =====================================================

    if decision["route"] == "LOCAL":

        memory = retrieve_memory(
            MemoryRequest(query=query)
        )

        if memory["found"]:

            private_context = "\n".join(
                f'{item["type"]}: {item["value"]}'
                for item in memory["items"]
            )

            answer = ask_local_gemma(
                (
                    f"User request:\n{query}\n\n"
                    f"Local private memory:\n{private_context}"
                ),
                (
                    "You are the local assistant inside PrivateAI Gateway. "
                    "You may use supplied private memory because this "
                    "reasoning happens locally. Answer naturally and "
                    "directly. Do not reveal private information that is "
                    "not needed for the user's request."
                ),
            )

            return {
                "status": "success",
                "route": "LOCAL",
                "privacy_status": "PRIVATE MEMORY USED LOCALLY",
                "response": answer,
                "disclosure_level": "local-only",
                "exact_value_exposed": False,
            }

        return {
            "status": "success",
            "route": "LOCAL",
            "privacy_status": "PROTECTED",
            "response": (
                "I checked your local private memory, but I couldn't "
                "find the information needed to answer that."
            ),
            "disclosure_level": "local-only",
            "exact_value_exposed": False,
        }

    # =====================================================
    # 4. EXACT PRIVATE-VALUE REQUEST
    # =====================================================

    permission = permission_request(
        PermissionRequest(query=query)
    )

    if permission.get("permission_required"):

        return {
            "status": "permission_required",
            "route": "LOCAL_GATEWAY",
            "privacy_status": "PROTECTED",
            "response": (
                "I can answer that, but the exact private value is "
                "stored locally. I need your permission before it can "
                "be disclosed for this request."
            ),
            "permission_required": True,
            "data_type": permission.get("data_type"),
            "purpose": permission.get("purpose"),
            "options": permission.get("options", []),
        }

    # =====================================================
    # 5. DETECT WHETHER THIS IS A REAL TASK
    # =====================================================
    #
    # Example:
    #   "My salary is 75000"
    #       -> acknowledge, don't repeat the value.
    #
    # Example:
    #   "My salary is 75000 and give me budgeting advice"
    #       -> actually answer the task using a derived salary range.
    #

    query_lower = query.lower()

    task_keywords = [
        "budget",
        "budgeting",
        "save",
        "saving",
        "savings",
        "spend",
        "spending",
        "expense",
        "expenses",
        "financial",
        "finance",
        "plan",
        "planning",
        "advice",
        "advise",
        "afford",
        "investment",
        "invest",
        "manage",
        "money",
        "money management",
        "compare",
        "comparison",
        "average",
        "benchmark",
        "career",
        "loan",
        "debt",
        "rent",
        "emi",
        "tax",
        "goal",
        "goals",
    ]

    has_task = any(
        keyword in query_lower
        for keyword in task_keywords
    )

    # =====================================================
    # 6. PRIVATE DATA ONLY — NATURAL ACKNOWLEDGEMENT
    # =====================================================

    if detected_data and not has_task:

        detected_types = ", ".join(
            sorted(
                {
                    item.get("type", "private information")
                    for item in detected_data
                }
            )
        )

        answer = ask_local_gemma(
            (
                "The user has just provided private information.\n"
                f"Detected type(s): {detected_types}.\n\n"
                "Reply naturally and briefly. Acknowledge that the "
                "information was received and protected locally. "
                "Do not repeat the private value. Do not mention "
                "internal privacy tokens. Invite the user to continue."
            ),
            (
                "You are the conversational assistant inside PrivateAI "
                "Gateway. Be warm, concise and natural. When a user "
                "provides private information, acknowledge it without "
                "repeating the value. Explain briefly that the exact "
                "value remains protected locally. Never mention internal "
                "tokens such as SALARY_1, EMAIL_1, PHONE_1 or AADHAAR_1."
            ),
        )

        return {
            "status": "success",
            "route": "LOCAL_AI",
            "privacy_status": "SENSITIVE DATA PROTECTED",
            "response": answer,
            "disclosure_level": "protected",
            "exact_value_exposed": False,
        }

    # =====================================================
    # 7. MINIMUM NECESSARY DISCLOSURE
    # =====================================================
    #
    # Exact salary stays in private_memory.
    # Only a coarse derived range is made available to Gemma.
    #

    disclosure = disclosure_plan(
        PermissionRequest(query=query)
    )

    if disclosure["disclosure_level"] == "minimum":

        salary_items = [
            item
            for item in private_memory.values()
            if item["type"] == "SALARY"
        ]

        if salary_items:
            try:
                exact_salary = int(
                    salary_items[-1]["value"]
                )
                salary_band = get_salary_band(
                    exact_salary
                )
            except (ValueError, TypeError):
                salary_band = "an unspecified salary range"
        else:
            salary_band = "an unspecified salary range"

        # -------------------------------------------------
        # IMPORTANT:
        # Remove every exact detected private value from the
        # user's text before it is sent to Gemma.
        # -------------------------------------------------

        privacy_safe_query = query

        # Replace salary numeric values first.
        for item in detected_data:

            token = item.get("token")

            if not token:
                continue

            for stored_value, stored_item in private_memory.items():

                if stored_item.get("token") != token:
                    continue

                exact_value = str(
                    stored_item.get("value", "")
                )

                if exact_value:
                    privacy_safe_query = privacy_safe_query.replace(
                        exact_value,
                        "[PRIVATE VALUE]",
                    )

                    # Also protect comma-formatted values.
                    if stored_item.get("type") == "SALARY":
                        try:
                            formatted_value = f"{int(exact_value):,}"
                            privacy_safe_query = privacy_safe_query.replace(
                                formatted_value,
                                "[PRIVATE VALUE]",
                            )
                        except (ValueError, TypeError):
                            pass

                break

        # Never allow internal tokens to reach Gemma either.
        for item in detected_data:
            token = item.get("token")
            if token:
                privacy_safe_query = privacy_safe_query.replace(
                    token,
                    "[PRIVATE VALUE]",
                )

        safe_task_prompt = (
            "The user wants help with this request:\n\n"
            f"{privacy_safe_query}\n\n"
            "Privacy-safe context prepared by the local gateway:\n"
            f"The user's monthly salary falls in {salary_band}.\n\n"
            "Privacy rules:\n"
            "- The exact salary is private and unavailable to you.\n"
            "- Do not ask for, reconstruct, or reveal the exact salary.\n"
            "- Do not mention internal privacy tokens.\n"
            "- Use the salary range only when it helps answer the task.\n"
            "- Actually answer the user's request.\n"
            "- Do not merely acknowledge that privacy protection occurred.\n"
            "- Respond naturally like a helpful conversational assistant."
        )

        add_audit_event(
            "Minimum context sent to local AI",
            (
                "Exact private value was replaced with a coarse derived "
                "salary range before AI reasoning."
            ),
            "SECURITY",
        )

        answer = ask_local_gemma(
            safe_task_prompt,
            (
                "You are the conversational AI inside PrivateAI Gateway.\n\n"
                "Provide a genuinely useful answer while respecting the "
                "privacy boundary enforced by the local gateway.\n\n"
                "The gateway has transformed sensitive information into "
                "minimum necessary derived context.\n\n"
                "Never request, reconstruct or reveal the exact private "
                "value. Never mention internal token names such as "
                "SALARY_1. Never output the exact salary amount.\n\n"
                "If the user asks for budgeting or financial advice, "
                "provide practical advice. You may use the supplied salary "
                "range, but do not pretend to know the exact salary.\n\n"
                "Be conversational, helpful, concise and natural. "
                "Reply in the same language as the user unless they "
                "ask for another language."
            ),
        )

        # Defense-in-depth: sanitize internal gateway tokens locally
        # before any model output reaches the browser.
        answer = sanitize_model_answer(answer)

        return {
            "status": "success",
            "route": "LOCAL_AI",
            "privacy_status": "MINIMUM DISCLOSURE",
            "response": answer,
            "disclosure_level": "minimum",
            "exact_value_exposed": False,
            "cloud_data": (
                f"Derived salary range only: {salary_band}"
            ),
        }

    # =====================================================
    # 8. NORMAL CONVERSATION
    # =====================================================

    model_prompt = remove_internal_tokens(safe_prompt)

    answer = ask_local_gemma(
        model_prompt,
        (
            "You are the conversational AI inside PrivateAI Gateway. "
            "Give helpful, natural, human-like answers to the user's "
            "actual question. Reply in the same language as the user "
            "unless the user asks for another language. Internal gateway tokens are implementation "
            "details and must never be mentioned. Never output strings "
            "such as SALARY_1, PHONE_1, EMAIL_1, or AADHAAR_1. "
            "If private information is represented generically, refer to "
            "it naturally, such as 'your private salary'. Never reconstruct "
            "hidden PII and never invent private values."
        ),
    )

    answer = sanitize_model_answer(answer)

    return {
        "status": "success",
        "route": "LOCAL_AI",
        "privacy_status": (
            "SENSITIVE DATA PROTECTED"
            if detected_data
            else "NO SENSITIVE DATA DETECTED"
        ),
        "response": answer,
        "disclosure_level": "protected",
        "exact_value_exposed": False,
    }


# =========================================================
# AUDIT LOG
# =========================================================

@app.get("/audit/log")
def get_audit_log():

    return {
        "events": audit_logs,
        "count": len(audit_logs),
    }


# =========================================================
# AUDIT LOGS ALIAS
# =========================================================

@app.get("/audit/logs")
def get_audit_logs_alias():

    return {
        "events": audit_logs,
        "count": len(audit_logs),
    }