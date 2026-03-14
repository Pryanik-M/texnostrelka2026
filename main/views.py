from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from users.models import EmailAccount, EmailSubscriptionCandidate
from django.db.models.functions import ExtractMonth
from django.db.models import Count, Sum
from .models import Subscription
from .forms import SubscriptionForm
from datetime import timedelta
from django.utils import timezone
import json
from django.db.models import Q



def home_view(request):
    return render(request, "main/index.html")


@login_required
def analytics_view(request):
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
    spending_by_month_raw = (
        subscriptions
        .annotate(month=ExtractMonth("next_payment_date"))
        .values("month")
        .annotate(total=Sum("price"))
        .order_by("month")
    )
    month_names = {
        1: "Январь",
        2: "Февраль",
        3: "Март",
        4: "Апрель",
        5: "Май",
        6: "Июнь",
        7: "Июль",
        8: "Август",
        9: "Сентябрь",
        10: "Октябрь",
        11: "Ноябрь",
        12: "Декабрь"
    }
    spending_by_month = []
    month_labels = []
    month_values = []
    for item in spending_by_month_raw:
        month_number = item["month"]
        month_name = month_names.get(month_number, str(month_number))
        total = float(item["total"] or 0)
        spending_by_month.append({
            "month": month_name,
            "total": total
        })
        month_labels.append(month_name)
        month_values.append(total)
    # подготовка данных для графиков
    category_labels = []
    category_counts = []
    for item in subscriptions_by_category:
        category_labels.append(item["category__name"] or "Без категории")
        category_counts.append(item["count"])
    spending_labels = []
    spending_values = []
    for item in spending_by_category:
        spending_labels.append(item["category__name"] or "Без категории")
        spending_values.append(float(item["total"] or 0))
    most_expensive = subscriptions.order_by("-price").first()
    cheapest = subscriptions.order_by("price").first()
    status_stats = (
        subscriptions
        .values("status")
        .annotate(count=Count("id"))
    )
    return render(request, "main/analytics.html", {
        "subscriptions_by_category": subscriptions_by_category,
        "spending_by_category": spending_by_category,
        "spending_by_month": spending_by_month,
        "category_labels": json.dumps(category_labels),
        "category_counts": json.dumps(category_counts),
        "spending_labels": json.dumps(spending_labels),
        "spending_values": json.dumps(spending_values),
        "month_labels": json.dumps(month_labels),
        "month_values": json.dumps(month_values),
        "most_expensive": most_expensive,
        "cheapest": cheapest,
        "status_stats": status_stats,
    })


@login_required
def forecast_view(request):
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
    total_week_spending = sum(
        sub.price for sub in upcoming_subscriptions
    )
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
        if date_str not in calendar_data:
            calendar_data[date_str] = []
        calendar_data[date_str].append({
            "name": sub.name,
            "price": float(sub.price),
            "currency": sub.currency
        })
    # рекомендации
    most_expensive_subscription = None
    top_category = None
    if subscriptions:
        most_expensive_subscription = subscriptions.order_by("-price").first()
        category_spending = {}
        for sub in subscriptions:
            category_name = sub.category.name if sub.category else "Без категории"
            if category_name not in category_spending:
                category_spending[category_name] = 0
            category_spending[category_name] += float(sub.price)
        if category_spending:
            top_category = max(category_spending, key=category_spending.get)
    return render(
        request,
        "main/forecast.html",
        {
            "upcoming_subscriptions": upcoming_subscriptions,
            "total_week_spending": total_week_spending,
            "monthly_forecast": monthly_forecast,
            "calendar_data": json.dumps(calendar_data),
            "yearly_forecast": yearly_forecast,
            "monthly_chart_labels": json.dumps(monthly_chart_labels),
            "monthly_chart_values": json.dumps(monthly_chart_values),
            "most_expensive_subscription": most_expensive_subscription,
            "top_category": top_category,
        }
    )


@login_required
def subscriptions_list(request):
    search = request.GET.get("search", "")
    subscriptions = Subscription.objects.filter(user=request.user)
    if search:
        subscriptions = subscriptions.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search) |
            Q(category__name__icontains=search)
        )
    return render(
        request,
        "main/subscriptions_list.html",
        {
            "subscriptions": subscriptions,
            "search": search
        },
    )


@login_required
def add_subscription(request):
    edit_id = request.GET.get("edit_id")
    edit_sub = None
    if edit_id:
        edit_sub = get_object_or_404(Subscription, id=edit_id, user=request.user)
    if request.method == "POST":
        if edit_sub:
            form = SubscriptionForm(request.POST, instance=edit_sub)
        else:
            form = SubscriptionForm(request.POST)
        if form.is_valid():
            subscription = form.save(commit=False)
            subscription.user = request.user
            subscription.save()
            return redirect("main:subscriptions")
    else:
        if edit_sub:
            form = SubscriptionForm(instance=edit_sub)
        else:
            form = SubscriptionForm()
    return render(
        request,
        "main/add_subscription.html",
        {
            "form": form,
            "edit_sub": edit_sub
        }
    )


@login_required
def delete_subscription(request, sub_id):
    subscription = get_object_or_404(Subscription, id=sub_id, user=request.user)
    if request.method == "POST":
        subscription.delete()
    return redirect("main:subscriptions")


@login_required
def email_sync(request):
    email_account = EmailAccount.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    if not email_account:
        return redirect("auth:profile")
    email_account.last_checked = timezone.now()
    email_account.save()
    return redirect("main:subscription_candidates")


@login_required
def email_disconnect(request):
    email_account = EmailAccount.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    if email_account:
        email_account.is_active = False
        email_account.save()
    return redirect("auth:profile")


def subscription_candidates(request):
    candidates = EmailSubscriptionCandidate.objects.filter(
        user=request.user,
        is_processed=False
    )

    for c in candidates:
        if "<" in c.sender:
            c.sender_email = c.sender.split("<")[1].replace(">", "")
        else:
            c.sender_email = c.sender

    return render(
        request,
        "main/subscription_candidates.html",
        {"candidates": candidates}
    )


@login_required
def accept_candidate(request, candidate_id):
    candidate = EmailSubscriptionCandidate.objects.get(
        id=candidate_id,
        user=request.user
    )
    Subscription.objects.create(
        user=request.user,
        name=candidate.detected_service,
        price=0,
        billing_period="month",
        start_date=timezone.now().date(),
        next_payment_date=timezone.now().date()
    )
    candidate.is_processed = True
    candidate.save()
    return redirect("main:subscription_candidates")


@login_required
def ignore_candidate(request, candidate_id):
    candidate = EmailSubscriptionCandidate.objects.get(
        id=candidate_id,
        user=request.user
    )
    candidate.is_processed = True
    candidate.save()
    return redirect("main:subscription_candidates")


@login_required
def confirm_candidate(request, candidate_id):
    candidate = EmailSubscriptionCandidate.objects.get(
        id=candidate_id,
        user=request.user
    )
    if request.method == "POST":
        form = SubscriptionForm(request.POST)
        if form.is_valid():
            subscription = form.save(commit=False)
            subscription.user = request.user
            subscription.save()
            candidate.is_processed = True
            candidate.save()
            return redirect("main:subscriptions")
    else:
        form = SubscriptionForm(
            initial={
                "name": candidate.detected_service,
                "price": candidate.detected_price or 0
            }
        )
    return render(
        request,
        "main/confirm_subscription.html",
        {
            "form": form,
            "candidate": candidate
        }
    )


@login_required
def create_subscription_from_email(request, candidate_id):
    candidate = EmailSubscriptionCandidate.objects.get(
        id=candidate_id,
        user=request.user)
    if request.method == "POST":
        form = SubscriptionForm(request.POST)
        if form.is_valid():
            subscription = form.save(commit=False)
            subscription.user = request.user
            subscription.save()
            candidate.is_processed = True
            candidate.save()
            return redirect("main:subscriptions")
    else:
        form = SubscriptionForm(initial={
            "name": candidate.detected_service
        })
    return render(request, "main/create_subscription_from_email.html",
        {"form": form, "candidate": candidate})