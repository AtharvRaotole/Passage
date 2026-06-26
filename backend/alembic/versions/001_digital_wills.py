"""Initial digital_wills table."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_digital_wills"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "digital_wills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_address", sa.String(length=42), nullable=False),
        sa.Column("website_url", sa.Text(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("encrypted_password", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("encrypted_symmetric_key", sa.Text(), nullable=False),
        sa.Column(
            "access_control_conditions",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("instruction", sa.Text(), nullable=False),
        sa.Column("totp_secret", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_digital_wills_user_address", "digital_wills", ["user_address"])
    op.create_index("idx_digital_wills_created_at", "digital_wills", ["created_at"])


def downgrade() -> None:
    op.drop_index("idx_digital_wills_created_at", table_name="digital_wills")
    op.drop_index("idx_digital_wills_user_address", table_name="digital_wills")
    op.drop_table("digital_wills")
