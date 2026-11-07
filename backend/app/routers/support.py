from fastapi import APIRouter, Depends

from .. import db
from ..schemas import SupportMessageIn
from ..security import get_current_user

router = APIRouter(prefix="/api/support", tags=["Support"])


@router.post("/messages", status_code=201)
def contact_support(body: SupportMessageIn, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        connection.execute(
            "INSERT INTO support_messages (user_id, subject, message) VALUES (?, ?, ?)",
            (user["id"], body.subject, body.message),
        )
    return {"message": "Thanks! Our support team will reply within 1-2 business days."}
