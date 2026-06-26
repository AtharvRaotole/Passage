"""Users and onboarding tables."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_users_and_onboarding"
down_revision: Union[str, None] = "001_digital_wills"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("privy_user_id", sa.String(length=255), nullable=False),
        sa.Column("wallet_address", sa.String(length=42), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("persona", sa.String(length=64), nullable=True),
        sa.Column("heartbeat_interval_days", sa.Integer(), nullable=True),
        sa.Column("required_confirmations", sa.Integer(), nullable=True),
        sa.Column("guardian_template", sa.String(length=32), nullable=True),
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint("privy_user_id"),
        sa.UniqueConstraint("wallet_address"),
    )
    op.create_index("idx_users_wallet_address", "users", ["wallet_address"])

    op.create_table(
        "user_guardians",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guardian_address", sa.String(length=42), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "position", name="uq_user_guardian_position"),
    )
    op.create_index("idx_user_guardians_user_id", "user_guardians", ["user_id"])

    op.create_table(
        "user_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("imported", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_user_accounts_user_id", "user_accounts", ["user_id"])

    op.create_table(
        "user_instructions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service", sa.String(length=255), nullable=False),
        sa.Column("instruction", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_user_instructions_user_id", "user_instructions", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_user_instructions_user_id", table_name="user_instructions")
    op.drop_table("user_instructions")
    op.drop_index("idx_user_accounts_user_id", table_name="user_accounts")
    op.drop_table("user_accounts")
    op.drop_index("idx_user_guardians_user_id", table_name="user_guardians")
    op.drop_table("user_guardians")
    op.drop_index("idx_users_wallet_address", table_name="users")
    op.drop_table("users")
