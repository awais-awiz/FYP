from __future__ import annotations

import asyncio
import importlib
import traceback
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from passlib.context import CryptContext

from app import database as db_module
from app.config import settings
from tools.fake_db import FakeClient


class DummyManager:
    async def broadcast_new_order(self, *_: Any, **__: Any) -> None:
        return None

    async def broadcast_order_update(self, *_: Any, **__: Any) -> None:
        return None


def _patch_environment() -> None:
    # Disable external API calls
    settings.GROQ_API_KEY = ""
    settings.OPENAI_API_KEY = ""
    settings.ASSEMBLYAI_API_KEY = ""
    settings.HEYGEN_API_KEY = ""

    # Patch websocket manager to avoid network calls
    import app.websockets.kitchen as kitchen_ws
    kitchen_ws.manager = DummyManager()

    # Patch voice-related services to avoid external APIs
    import app.services.whisper_service as whisper_service
    import app.services.heygen_service as heygen_service
    import app.services.grok_service as grok_service

    async def _stub_transcribe_audio(*_: Any, **__: Any) -> Dict[str, Any]:
        return {"text": "", "success": False}

    async def _stub_tts(_: str) -> Dict[str, Any]:
        return {"audio_base64": None, "use_browser_tts": True}

    async def _stub_process_voice_order(*_: Any, **__: Any) -> Dict[str, Any]:
        return {
            "success": True,
            "response_text": "Stub response",
            "order_placed": False,
            "order_id": None,
            "order_data": None,
        }

    whisper_service.transcribe_audio = _stub_transcribe_audio
    heygen_service.text_to_speech = _stub_tts
    grok_service.process_voice_order = _stub_process_voice_order


def _test_pwd_context() -> CryptContext:
    return CryptContext(schemes=["sha256_crypt"], deprecated="auto")


class Report:
    def __init__(self) -> None:
        self.items: List[Dict[str, str]] = []

    def add(self, name: str, status: str, detail: str = "") -> None:
        self.items.append({"name": name, "status": status, "detail": detail})

    def print(self) -> None:
        ok = sum(1 for i in self.items if i["status"] == "ok")
        warn = sum(1 for i in self.items if i["status"] == "warn")
        fail = sum(1 for i in self.items if i["status"] == "fail")
        total = len(self.items)
        print(f"Route check results: {ok} ok, {warn} warn, {fail} fail, {total} total")
        for item in self.items:
            line = f"- {item['status'].upper()}: {item['name']}"
            if item["detail"]:
                line += f" -> {item['detail']}"
            print(line)


async def _seed_data(db) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    pwd_context = _test_pwd_context()

    admin_hash = pwd_context.hash("admin123")
    user_hash = pwd_context.hash("pass123")

    await db.admins.insert_one({
        "username": "admin",
        "password_hash": admin_hash,
        "full_name": "System Admin",
        "role": "admin",
        "created_at": now,
    })

    await db.users.insert_one({
        "username": "server1",
        "password_hash": user_hash,
        "full_name": "Server One",
        "role": "server",
        "email": "server1@example.com",
        "phone": "123",
        "is_active": True,
        "created_at": now,
    })

    menu_item_1 = {
        "name": "Wagyu Steak",
        "description": "Premium steak",
        "price": 50.0,
        "category": "Main Course",
        "is_available": True,
        "stock_quantity": 10,
        "prep_time_minutes": 20,
        "is_vegetarian": False,
        "created_at": now,
        "updated_at": now,
    }
    menu_item_2 = {
        "name": "Truffle Risotto",
        "description": "Creamy risotto",
        "price": 25.0,
        "category": "Main Course",
        "is_available": True,
        "stock_quantity": 8,
        "prep_time_minutes": 15,
        "is_vegetarian": True,
        "created_at": now,
        "updated_at": now,
    }
    res1 = await db.menu_items.insert_one(menu_item_1)
    res2 = await db.menu_items.insert_one(menu_item_2)

    order_1 = {
        "order_id": "ORD-TEST-1",
        "table_number": 1,
        "items": [{
            "menu_item_id": str(res1.inserted_id),
            "name": "Wagyu Steak",
            "price": 50.0,
            "quantity": 1,
            "category": "Main Course",
        }],
        "total_price": 50.0,
        "status": "completed",
        "payment_status": "paid",
        "created_at": now - timedelta(days=1),
        "updated_at": now - timedelta(hours=1),
    }
    order_2 = {
        "order_id": "ORD-TEST-2",
        "table_number": 1,
        "items": [{
            "menu_item_id": str(res2.inserted_id),
            "name": "Truffle Risotto",
            "price": 25.0,
            "quantity": 2,
            "category": "Main Course",
        }],
        "total_price": 50.0,
        "status": "pending",
        "payment_status": "unpaid",
        "created_at": now,
        "updated_at": now,
    }
    await db.orders.insert_one(order_1)
    await db.orders.insert_one(order_2)

    await db.feedback.insert_one({
        "feedback_id": "FB-TEST",
        "order_id": "ORD-TEST-1",
        "table_number": 1,
        "text": "Great food",
        "rating": 5,
        "sentiment": "positive",
        "created_at": now - timedelta(days=1),
    })

    approval = await db.approvals.insert_one({
        "staff": "server1",
        "status": "pending",
        "created_at": now,
    })
    rejection = await db.approvals.insert_one({
        "staff": "server1",
        "status": "pending",
        "created_at": now,
    })

    return {
        "menu_item_ids": [str(res1.inserted_id), str(res2.inserted_id)],
        "approval_id": str(approval.inserted_id),
        "rejection_id": str(rejection.inserted_id),
    }


def _import_route(report: Report, module_path: str):
    try:
        return importlib.import_module(module_path)
    except Exception as exc:
        report.add(module_path, "fail", f"import error: {exc.__class__.__name__}: {exc}")
        return None


async def _run_case(report: Report, name: str, coro) -> None:
    try:
        await coro
        report.add(name, "ok")
    except Exception as exc:
        detail = f"{exc.__class__.__name__}: {exc}"
        report.add(name, "fail", detail)


async def _run_case_allow_http(report: Report, name: str, coro, allow_status: Optional[int] = None) -> None:
    try:
        await coro
        report.add(name, "ok")
    except Exception as exc:
        status = getattr(exc, "status_code", None)
        if allow_status and status == allow_status:
            report.add(name, "warn", f"HTTP {status}")
        else:
            detail = f"{exc.__class__.__name__}: {exc}"
            report.add(name, "fail", detail)


async def run(use_real_db: bool = False) -> None:
    report = Report()

    _patch_environment()

    test_db_name = f"{settings.DATABASE_NAME}_route_tests"

    if use_real_db:
        await db_module.connect_to_mongo()

        def _get_db_override():
            return db_module.client[test_db_name]

        db_module.get_database = _get_db_override
        await db_module.client.drop_database(test_db_name)
    else:
        fake_client = FakeClient()
        db_module.client = fake_client

        def _get_db_override():
            return fake_client[test_db_name]

        db_module.get_database = _get_db_override

    db = db_module.get_database()
    seed_info = await _seed_data(db)

    # Admin
    admin_routes = _import_route(report, "app.routes.admin")
    if admin_routes:
        admin_routes.pwd_context = _test_pwd_context()
        from app.models.admin import AdminCreate, AdminLogin
        await _run_case(report, "admin.register", admin_routes.register_admin(AdminCreate(
            username="admin2",
            password="pass123",
            full_name="Admin Two",
            role="admin",
        )))
        await _run_case(report, "admin.login", admin_routes.login(AdminLogin(
            username="admin",
            password="admin123",
        )))
        await _run_case(report, "admin.dashboard", admin_routes.get_dashboard_stats())
        await _run_case(report, "admin.order_history", admin_routes.get_order_history())

    # Ambience
    ambience_routes = _import_route(report, "app.routes.ambience")
    if ambience_routes:
        from app.models.ambience import AmbienceUpdate
        await _run_case(report, "ambience.get", ambience_routes.get_ambience(1))
        await _run_case(report, "ambience.update", ambience_routes.update_ambience(1, AmbienceUpdate(
            brightness=80,
            color_mode="warm",
        )))
        await _run_case(report, "ambience.preset", ambience_routes.apply_preset(1, "romantic_dinner"))

    # Auth
    auth_routes = _import_route(report, "app.routes.auth")
    if auth_routes:
        auth_routes.pwd_context = _test_pwd_context()
        from app.models.user import UserLogin, PasswordChange
        await _run_case(report, "auth.login", auth_routes.login(UserLogin(
            username="server1",
            password="pass123",
        )))
        await _run_case(report, "auth.me", auth_routes.get_me({"username": "server1", "role": "server"}))
        await _run_case(report, "auth.change_password", auth_routes.change_password(
            PasswordChange(current_password="pass123", new_password="newpass123"),
            {"username": "server1", "role": "server"},
        ))

    # Chatbot
    chatbot_routes = _import_route(report, "app.routes.chatbot")
    if chatbot_routes:
        from app.models.chat import ChatRequest
        await _run_case(report, "chatbot.chat", chatbot_routes.chat(ChatRequest(
            session_id="table-1-2025",
            message="What do you recommend?",
            language="en",
            table_number=1,
        )))
        await _run_case(report, "chatbot.history", chatbot_routes.get_history("table-1-2025"))
        await _run_case(report, "chatbot.clear", chatbot_routes.clear_history("table-1-2025"))
        await _run_case(report, "chatbot.recommendations", chatbot_routes.get_recommendations(1, "vegetarian"))

    # Feedback
    feedback_routes = _import_route(report, "app.routes.feedback")
    if feedback_routes:
        from app.models.feedback import FeedbackCreate
        await _run_case(report, "feedback.submit", feedback_routes.submit_feedback(FeedbackCreate(
            order_id="ORD-TEST-1",
            table_number=1,
            text="Great meal",
            rating=5,
        )))
        await _run_case(report, "feedback.list", feedback_routes.get_all_feedback())
        await _run_case(report, "feedback.stats", feedback_routes.get_feedback_stats())

    # Languages
    languages_routes = _import_route(report, "app.routes.languages")
    if languages_routes:
        from app.models.language import LanguageDetectRequest, TranslationRequest
        await _run_case(report, "languages.list", languages_routes.list_languages())
        await _run_case(report, "languages.detect", languages_routes.detect(LanguageDetectRequest(
            text="سلام"
        )))
        await _run_case_allow_http(report, "languages.translate", languages_routes.translate(TranslationRequest(
            text="Hello",
            target_language="ur",
        )), allow_status=503)

    # Menu
    menu_routes = _import_route(report, "app.routes.menu")
    if menu_routes:
        from app.models.menu import MenuItemCreate, MenuItemUpdate
        created = await menu_routes.create_menu_item(MenuItemCreate(
            name="Penne Arrabbiata",
            description="Pasta",
            price=18.0,
            category="Main Course",
            is_available=True,
            stock_quantity=5,
        ))
        created_id = created.get("_id")
        await _run_case(report, "menu.list", menu_routes.get_menu_items())
        await _run_case(report, "menu.categories", menu_routes.get_categories())
        await _run_case(report, "menu.get", menu_routes.get_menu_item(created_id))
        await _run_case(report, "menu.update", menu_routes.update_menu_item(created_id, MenuItemUpdate(
            price=19.0,
        )))
        await _run_case(report, "menu.delete", menu_routes.delete_menu_item(created_id))

    # Models3D
    models3d_routes = _import_route(report, "app.routes.models3d")
    if models3d_routes:
        await _run_case(report, "models3d.list", models3d_routes.get_all_models())
        await _run_case(report, "models3d.get", models3d_routes.get_model("model_wagyu"))
        await _run_case(report, "models3d.by_menu", models3d_routes.get_model_by_menu_item("Wagyu Steak"))

    # Orders
    orders_routes = _import_route(report, "app.routes.orders")
    if orders_routes:
        from app.models.order import OrderCreate, OrderItem, OrderStatusUpdate, OrderStatus
        order = await orders_routes.create_order(OrderCreate(
            table_number=2,
            items=[OrderItem(menu_item_id=seed_info["menu_item_ids"][0], name="Wagyu Steak", price=50.0, quantity=1)],
        ))
        order_id = order.get("order_id")
        await _run_case(report, "orders.get", orders_routes.get_order(order_id))
        await _run_case(report, "orders.table", orders_routes.get_table_orders(1))
        await _run_case(report, "orders.table_active", orders_routes.get_active_table_orders(1))
        await _run_case(report, "orders.update_status", orders_routes.update_order_status(
            order_id,
            OrderStatusUpdate(status=OrderStatus.CONFIRMED),
        ))
        await _run_case(report, "orders.kitchen_active", orders_routes.get_kitchen_active_orders())
        await _run_case(report, "orders.kitchen_stats", orders_routes.get_kitchen_stats())

    # Payments
    payments_routes = _import_route(report, "app.routes.payments")
    if payments_routes:
        from app.models.payment import PaymentCreate, PaymentConfirm, PaymentMethod
        payment = await payments_routes.generate_qr_payment(PaymentCreate(
            order_id="ORD-TEST-1",
            amount=50.0,
            method=PaymentMethod.QR,
        ))
        payment_id = payment.get("payment_id")
        await _run_case(report, "payments.confirm", payments_routes.confirm_payment(PaymentConfirm(
            payment_id=payment_id,
        )))
        await _run_case(report, "payments.get", payments_routes.get_payment(payment_id))
        await _run_case(report, "payments.by_order", payments_routes.get_payment_by_order("ORD-TEST-1"))

    # Sales
    sales_routes = _import_route(report, "app.routes.sales")
    if sales_routes:
        await _run_case(report, "sales.summary", sales_routes.sales_summary("week"))
        await _run_case(report, "sales.top_items", sales_routes.top_items("month", 5))
        await _run_case(report, "sales.revenue", sales_routes.revenue_chart(7))

    # Staff
    staff_routes = _import_route(report, "app.routes.staff")
    if staff_routes:
        staff_routes.pwd_context = _test_pwd_context()
        from app.models.user import UserCreate, UserUpdate
        await _run_case(report, "staff.list", staff_routes.list_staff())
        await _run_case(report, "staff.create", staff_routes.create_staff(UserCreate(
            username="cleaner1",
            password="cleanpass",
            full_name="Cleaner One",
            role="cleaner",
        )))
        await _run_case(report, "staff.pending", staff_routes.get_pending_approvals())
        await _run_case(report, "staff.approve", staff_routes.approve_request(seed_info["approval_id"]))
        await _run_case(report, "staff.reject", staff_routes.reject_request(seed_info["rejection_id"], "no"))
        await _run_case(report, "staff.update", staff_routes.update_staff("server1", UserUpdate(
            full_name="Server One Updated",
        )))
        await _run_case(report, "staff.delete", staff_routes.delete_staff("cleaner1"))

    # Stripe Payments
    stripe_routes = _import_route(report, "app.routes.stripe_payments")
    if stripe_routes:
        from app.models.stripe_payment import StripePaymentCreate
        result = await stripe_routes.create_intent(StripePaymentCreate(
            order_id="ORD-TEST-1",
            amount=50.0,
            currency="usd",
            table_number=1,
        ))
        payment_intent_id = result.get("payment_intent_id")
        await _run_case(report, "stripe.status", stripe_routes.get_payment_status(payment_intent_id))
        await _run_case(report, "stripe.simulate", stripe_routes.simulate_payment("ORD-TEST-1", 50.0))
        await _run_case(report, "stripe.generate_qr", stripe_routes.generate_qr("test"))

    # Tables
    tables_routes = _import_route(report, "app.routes.tables")
    if tables_routes:
        from app.models.table import TableSessionCreate
        await _run_case(report, "tables.create", tables_routes.create_session(TableSessionCreate(
            table_number=3,
            language="en",
        )))
        await _run_case(report, "tables.active", tables_routes.get_active_session(3))
        await _run_case(report, "tables.end", tables_routes.end_session(3))
        await _run_case(report, "tables.active_all", tables_routes.get_all_active_tables())

    # Tasks
    tasks_routes = _import_route(report, "app.routes.tasks")
    if tasks_routes:
        from app.models.task import TaskCreate, TaskStatusUpdate, TaskStatus
        created = await tasks_routes.create_task(TaskCreate(
            title="Clean Table 5",
            assigned_to="cleaner1",
            role="cleaner",
        ))
        task_id = created.get("task_id")
        await _run_case(report, "tasks.list", tasks_routes.list_tasks())
        await _run_case(report, "tasks.get", tasks_routes.get_task(task_id))
        await _run_case(report, "tasks.update", tasks_routes.update_task_status(
            task_id,
            TaskStatusUpdate(status=TaskStatus.IN_PROGRESS, notes="Started"),
        ))
        await _run_case(report, "tasks.delete", tasks_routes.delete_task(task_id))

    # Voice
    voice_routes = _import_route(report, "app.routes.voice")
    if voice_routes:
        await _run_case(report, "voice.order", voice_routes.voice_order(
            audio=None,
            transcript="I want a burger",
            table_number=1,
            language="en",
        ))

    if use_real_db:
        await db_module.close_mongo_connection()

    report.print()


if __name__ == "__main__":
    asyncio.run(run())
