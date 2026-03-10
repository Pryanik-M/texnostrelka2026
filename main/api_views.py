from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import date, datetime
from django.db.models import Count, Sum
from django.db.models.functions import ExtractMonth
import json

from .models import Subscription, Category
from users.models import EmailAccount, EmailSubscriptionCandidate


def _require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)
    return None


def _json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return {}


def categories_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    data = list(Category.objects.all().values('id', 'name', 'description'))
    return JsonResponse(data, safe=False)


@csrf_exempt
def _parse_date(value):
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return timezone.now().date()
    return timezone.now().date()


def _date_iso(value):
    if isinstance(value, str):
        try:
            return datetime.strptime(value, "%Y-%m-%d").date().isoformat()
        except ValueError:
            return value
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return timezone.now().date().isoformat()


def subscriptions_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    if request.method == 'GET':
        subs = Subscription.objects.filter(user=request.user).order_by('next_payment_date')
        data = [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category_id,
                "description": s.description,
                "price": str(s.price),
                "currency": s.currency,
                "billing_period": s.billing_period,
                "start_date": _date_iso(s.start_date),
                "next_payment_date": _date_iso(s.next_payment_date),
                "status": s.status,
                "service_url": s.service_url,
                "notes": s.notes,
            }
            for s in subs
        ]
        return JsonResponse(data, safe=False)

    if request.method == 'POST':
        data = _json_body(request)
        category_id = data.get('category')
        category = Category.objects.filter(id=category_id).first() if category_id else None
        sub = Subscription.objects.create(
            user=request.user,
            name=data.get('name') or 'Подписка',
            category=category,
            description=data.get('description') or '',
            price=data.get('price') or 0,
            currency=data.get('currency') or 'RUB',
            billing_period=data.get('billing_period') or 'month',
            start_date=_parse_date(data.get('start_date')),
            next_payment_date=_parse_date(data.get('next_payment_date')),
            status=data.get('status') or 'active',
            service_url=data.get('service_url') or '',
            notes=data.get('notes') or '',
        )
        return JsonResponse({"message": "created", "subscription": {
            "id": sub.id,
            "name": sub.name,
            "category": sub.category_id,
            "description": sub.description,
            "price": str(sub.price),
            "currency": sub.currency,
            "billing_period": sub.billing_period,
            "start_date": _date_iso(sub.start_date),
            "next_payment_date": _date_iso(sub.next_payment_date),
            "status": sub.status,
            "service_url": sub.service_url,
            "notes": sub.notes,
        }})

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@csrf_exempt
def subscription_detail_api(request, sub_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    sub = Subscription.objects.filter(user=request.user, id=sub_id).first()
    if not sub:
        return JsonResponse({"detail": "Not found"}, status=404)

    if request.method == 'PATCH':
        data = _json_body(request)
        if 'name' in data:
            sub.name = data['name']
        if 'category' in data:
            sub.category_id = data['category'] or None
        if 'description' in data:
            sub.description = data['description'] or ''
        if 'price' in data:
            sub.price = data['price'] or 0
        if 'currency' in data:
            sub.currency = data['currency'] or 'RUB'
        if 'billing_period' in data:
            sub.billing_period = data['billing_period'] or 'month'
        if 'start_date' in data:
            sub.start_date = _parse_date(data['start_date'])
        if 'next_payment_date' in data:
            sub.next_payment_date = _parse_date(data['next_payment_date'])
        if 'status' in data:
            sub.status = data['status'] or 'active'
        if 'service_url' in data:
            sub.service_url = data['service_url'] or ''
        if 'notes' in data:
            sub.notes = data['notes'] or ''
        sub.save()

        return JsonResponse({
            "id": sub.id,
            "name": sub.name,
            "category": sub.category_id,
            "description": sub.description,
            "price": str(sub.price),
            "currency": sub.currency,
            "billing_period": sub.billing_period,
            "start_date": _date_iso(sub.start_date),
            "next_payment_date": _date_iso(sub.next_payment_date),
            "status": sub.status,
            "service_url": sub.service_url,
            "notes": sub.notes,
        })

    if request.method == 'DELETE':
        sub.delete()
        return JsonResponse({"message": "deleted"})

    return JsonResponse({"detail": "Method not allowed"}, status=405)


def analytics_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    subscriptions = Subscription.objects.filter(user=request.user)
    subscriptions_by_category = (
        subscriptions.values("category__name").annotate(count=Count("id"))
    )
    spending_by_category = (
        subscriptions.values("category__name").annotate(total=Sum("price"))
    )
    spending_by_month = (
        subscriptions.annotate(month=ExtractMonth("next_payment_date"))
        .values("month")
        .annotate(total=Sum("price"))
        .order_by("month")
    )

    most_expensive = subscriptions.order_by("-price").first()
    cheapest = subscriptions.order_by("price").first()
    status_stats = subscriptions.values("status").annotate(count=Count("id"))

    return JsonResponse({
        "subscriptions_by_category": list(subscriptions_by_category),
        "spending_by_category": list(spending_by_category),
        "spending_by_month": list(spending_by_month),
        "most_expensive": {
            "id": most_expensive.id,
            "name": most_expensive.name,
            "category": most_expensive.category_id,
            "description": most_expensive.description,
            "price": str(most_expensive.price),
            "currency": most_expensive.currency,
            "billing_period": most_expensive.billing_period,
            "start_date": most_expensive.start_date.isoformat(),
            "next_payment_date": most_expensive.next_payment_date.isoformat(),
            "status": most_expensive.status,
            "service_url": most_expensive.service_url,
            "notes": most_expensive.notes,
        } if most_expensive else None,
        "cheapest": {
            "id": cheapest.id,
            "name": cheapest.name,
            "category": cheapest.category_id,
            "description": cheapest.description,
            "price": str(cheapest.price),
            "currency": cheapest.currency,
            "billing_period": cheapest.billing_period,
            "start_date": cheapest.start_date.isoformat(),
            "next_payment_date": cheapest.next_payment_date.isoformat(),
            "status": cheapest.status,
            "service_url": cheapest.service_url,
            "notes": cheapest.notes,
        } if cheapest else None,
        "status_stats": list(status_stats),
    })


def forecast_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    subscriptions = Subscription.objects.filter(user=request.user, status="active")
    today = timezone.now().date()
    week_later = today + timezone.timedelta(days=7)

    upcoming_subscriptions = subscriptions.filter(
        next_payment_date__gte=today,
        next_payment_date__lte=week_later
    ).order_by("next_payment_date")

    total_week_spending = float(sum(sub.price for sub in upcoming_subscriptions))

    monthly_forecast = 0
    for sub in subscriptions:
        if sub.billing_period == "month":
            monthly_forecast += sub.price
        elif sub.billing_period == "week":
            monthly_forecast += sub.price * 4
        elif sub.billing_period == "day":
            monthly_forecast += sub.price * 30
        elif sub.billing_period == "year":
            monthly_forecast += sub.price / 12

    yearly_forecast = float(monthly_forecast) * 12

    monthly_chart_labels = [
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    ]
    monthly_chart_values = [0] * 12
    for sub in subscriptions:
        month_index = sub.next_payment_date.month - 1
        if sub.billing_period == "month":
            monthly_chart_values[month_index] += float(sub.price)
        elif sub.billing_period == "week":
            monthly_chart_values[month_index] += float(sub.price) * 4
        elif sub.billing_period == "day":
            monthly_chart_values[month_index] += float(sub.price) * 30
        elif sub.billing_period == "year":
            monthly_chart_values[month_index] += float(sub.price)

    calendar_data = {}
    for sub in subscriptions:
        date_str = sub.next_payment_date.strftime("%Y-%m-%d")
        calendar_data.setdefault(date_str, []).append({
            "name": sub.name,
            "price": float(sub.price),
            "currency": sub.currency,
        })

    return JsonResponse({
        "upcoming_subscriptions": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category_id,
                "description": s.description,
                "price": str(s.price),
                "currency": s.currency,
                "billing_period": s.billing_period,
                "start_date": s.start_date.isoformat(),
                "next_payment_date": s.next_payment_date.isoformat(),
                "status": s.status,
                "service_url": s.service_url,
                "notes": s.notes,
            }
            for s in upcoming_subscriptions
        ],
        "total_week_spending": total_week_spending,
        "monthly_forecast": float(monthly_forecast),
        "yearly_forecast": yearly_forecast,
        "monthly_chart_labels": monthly_chart_labels,
        "monthly_chart_values": monthly_chart_values,
        "calendar_data": calendar_data,
    })


@csrf_exempt
def candidates_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    candidates = EmailSubscriptionCandidate.objects.filter(
        user=request.user,
        is_processed=False
    )

    data = [
        {
            "id": c.id,
            "subject": c.subject,
            "sender": c.sender,
            "detected_service": c.detected_service,
            "snippet": c.snippet,
            "confidence": c.confidence,
        }
        for c in candidates
    ]
    return JsonResponse(data, safe=False)


@csrf_exempt
def accept_candidate_api(request, candidate_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    candidate = EmailSubscriptionCandidate.objects.filter(id=candidate_id, user=request.user).first()
    if not candidate:
        return JsonResponse({"detail": "Not found"}, status=404)

    Subscription.objects.create(
        user=request.user,
        name=candidate.detected_service or 'Подписка',
        price=0,
        billing_period="month",
        start_date=timezone.now().date(),
        next_payment_date=timezone.now().date(),
    )
    candidate.is_processed = True
    candidate.save()

    return JsonResponse({"message": "accepted"})


@csrf_exempt
def ignore_candidate_api(request, candidate_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    candidate = EmailSubscriptionCandidate.objects.filter(id=candidate_id, user=request.user).first()
    if not candidate:
        return JsonResponse({"detail": "Not found"}, status=404)

    candidate.is_processed = True
    candidate.save()

    return JsonResponse({"message": "ignored"})


@csrf_exempt
def email_sync_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    email_account = EmailAccount.objects.filter(user=request.user, is_active=True).first()
    if not email_account:
        return JsonResponse({"message": "no active email"})
    email_account.last_checked = timezone.now()
    email_account.save()
    return JsonResponse({"message": "sync started", "last_checked": email_account.last_checked.isoformat()})


@csrf_exempt
def email_disconnect_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    email_account = EmailAccount.objects.filter(user=request.user, is_active=True).first()
    if email_account:
        email_account.is_active = False
        email_account.save()
    return JsonResponse({"message": "email disconnected"})

