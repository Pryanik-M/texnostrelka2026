from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import ExtractMonth

from users.models import EmailSubscriptionCandidate, EmailAccount
from .models import Category, Subscription
from .serializers import CategorySerializer, SubscriptionSerializer
from datetime import timedelta


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def categories_api(request):
    categories = Category.objects.all().order_by("name")
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_api(request):
    subscriptions = Subscription.objects.filter(user=request.user)
    # количество подписок по категориям
    subscriptions_by_category = (
        subscriptions
        .values("category__name")
        .annotate(count=Count("id"))
    )
    # расходы по категориям
    spending_by_category = (
        subscriptions
        .values("category__name")
        .annotate(total=Sum("price"))
    )
    # расходы по месяцам
    spending_by_month = (
        subscriptions
        .annotate(month=ExtractMonth("next_payment_date"))
        .values("month")
        .annotate(total=Sum("price"))
        .order_by("month")
    )
    most_expensive = subscriptions.order_by("-price").first()
    cheapest = subscriptions.order_by("price").first()
    status_stats = (
        subscriptions
        .values("status")
        .annotate(count=Count("id"))
    )
    return Response({
        "subscriptions_by_category": list(subscriptions_by_category),
        "spending_by_category": list(spending_by_category),
        "spending_by_month": list(spending_by_month),
        "most_expensive": SubscriptionSerializer(most_expensive).data if most_expensive else None,
        "cheapest": SubscriptionSerializer(cheapest).data if cheapest else None,
        "status_stats": list(status_stats),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def forecast_api(request):
    subscriptions = Subscription.objects.filter(
        user=request.user,
        status="active"
    )
    today = timezone.now().date()
    week_later = today + timedelta(days=7)
    upcoming_subscriptions = subscriptions.filter(
        next_payment_date__gte=today,
        next_payment_date__lte=week_later
    ).order_by("next_payment_date")
    total_week_spending = sum(sub.price for sub in upcoming_subscriptions)
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
    yearly_forecast = monthly_forecast * 12
    # данные для графика
    monthly_chart_labels = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
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
    # календарь платежей
    calendar_data = {}
    for sub in subscriptions:
        date_str = sub.next_payment_date.strftime("%Y-%m-%d")
        if date_str not in calendar_data:
            calendar_data[date_str] = []
        calendar_data[date_str].append({
            "name": sub.name,
            "price": float(sub.price),
            "currency": sub.currency
        })
    return Response({
        "upcoming_subscriptions": SubscriptionSerializer(upcoming_subscriptions, many=True).data,
        "total_week_spending": float(total_week_spending),
        "monthly_forecast": float(monthly_forecast),
        "yearly_forecast": float(yearly_forecast),
        "monthly_chart_labels": monthly_chart_labels,
        "monthly_chart_values": monthly_chart_values,
        "calendar_data": calendar_data,
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def subscriptions_api(request):
    if request.method == "GET":
        subscriptions = Subscription.objects.filter(user=request.user)
        # поиск
        search = request.GET.get("search")
        if search:
            subscriptions = subscriptions.filter(name__icontains=search)
        # фильтр по статусу
        status = request.GET.get("status")
        if status:
            subscriptions = subscriptions.filter(status=status)
        # сортировка
        order = request.GET.get("order", "-created_at")
        subscriptions = subscriptions.order_by(order)
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)
    if request.method == "POST":
        serializer = SubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            subscription = serializer.save(user=request.user)
            return Response({
                "message": "Subscription created",
                "subscription": SubscriptionSerializer(subscription).data
            }, status=201)
        return Response(serializer.errors, status=400)
    serializer = SubscriptionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def subscription_detail_api(request, sub_id):
    subscription = get_object_or_404(
        Subscription,
        id=sub_id,
        user=request.user
    )
    if request.method == "GET":
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    if request.method in ["PUT", "PATCH"]:
        partial = request.method == "PATCH"
        serializer = SubscriptionSerializer(
            subscription,
            data=request.data,
            partial=partial
        )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    if request.method == "DELETE":
        subscription.delete()
        return Response({"message": "Subscription deleted"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def candidates_api(request):
    candidates = EmailSubscriptionCandidate.objects.filter(
        user=request.user,
        is_processed=False
    ).order_by("id")
    data = []
    for c in candidates:
        data.append({
            "id": c.id,
            "subject": c.subject,
            "sender": c.sender,
            "detected_service": c.detected_service,
            "message_id": c.message_id,
            "snippet": c.snippet,
            "confidence": c.confidence
        })
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_candidate_api(request, candidate_id):
    candidate = get_object_or_404(
        EmailSubscriptionCandidate,
        id=candidate_id,
        user=request.user,
        is_processed=False
    )
    today = timezone.now().date()
    subscription = Subscription.objects.create(
        user=request.user,
        name=candidate.detected_service or "Unknown",
        price=0,
        billing_period="month",
        start_date=today,
        next_payment_date=today
    )
    candidate.is_processed = True
    candidate.save(update_fields=["is_processed"])
    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ignore_candidate_api(request, candidate_id):
    candidate = get_object_or_404(
        EmailSubscriptionCandidate,
        id=candidate_id,
        user=request.user,
        is_processed=False
    )
    candidate.is_processed = True
    candidate.save(update_fields=["is_processed"])
    return Response({"message": "Candidate ignored"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_from_candidate_api(request, candidate_id):
    candidate = get_object_or_404(
        EmailSubscriptionCandidate,
        id=candidate_id,
        user=request.user,
        is_processed=False
    )
    data = request.data.copy()
    today = timezone.now().date().isoformat()
    data.setdefault("name", candidate.detected_service or "Unknown")
    data.setdefault("price", 0)
    data.setdefault("currency", "RUB")
    data.setdefault("billing_period", "month")
    data.setdefault("start_date", today)
    data.setdefault("next_payment_date", today)
    data.setdefault("status", "active")
    serializer = SubscriptionSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    subscription = serializer.save(user=request.user)
    candidate.is_processed = True
    candidate.save(update_fields=["is_processed"])
    return Response(SubscriptionSerializer(subscription).data, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def email_sync_api(request):
    email_account = EmailAccount.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    if not email_account:
        return Response(
            {"error": "Email account not connected"},
            status=400
        )
    email_account.last_checked = timezone.now()
    email_account.save(update_fields=["last_checked"])
    return Response({
        "message": "Email sync started",
        "last_checked": email_account.last_checked
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def email_disconnect_api(request):
    email_account = EmailAccount.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    if not email_account:
        return Response(
            {"error": "Email account not connected"},
            status=400
        )
    email_account.is_active = False
    email_account.save(update_fields=["is_active"])
    return Response({
        "message": "Email account disconnected"
    })