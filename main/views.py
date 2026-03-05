from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from users.models import EmailAccount, EmailSubscriptionCandidate
from django.db.models.functions import ExtractMonth
from django.db.models import Count, Sum
# from users.email_scanner import scan_yandex_email
from .models import Subscription
from .forms import SubscriptionForm
from django.utils import timezone
import json



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


def forecast_view(request):
    return render(request, "main/forecast.html")


@login_required
def subscriptions_list(request):
    subscriptions = Subscription.objects.filter(user=request.user)
    return render(
        request,
        "main/subscriptions_list.html",
        {"subscriptions": subscriptions},
    )


@login_required
def add_subscription(request):

    candidate_id = request.GET.get("candidate")

    initial_data = {}

    if candidate_id:
        try:
            candidate = EmailSubscriptionCandidate.objects.get(
                id=candidate_id,
                user=request.user
            )
            initial_data = {
                "name": candidate.detected_service,
                "description": candidate.subject,
            }
        except EmailSubscriptionCandidate.DoesNotExist:
            pass
    if request.method == "POST":
        form = SubscriptionForm(request.POST)
        if form.is_valid():
            subscription = form.save(commit=False)
            subscription.user = request.user
            subscription.save()
            return redirect("main:subscriptions")
    else:
        form = SubscriptionForm(initial=initial_data)
    return render(
        request,
        "main/add_subscription.html",
        {"form": form}
    )


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


@login_required
def subscription_candidates(request):
    candidates = EmailSubscriptionCandidate.objects.filter(
        user=request.user,
        is_processed=False
    )
    return render(
        request,
        "main/subscription_candidates.html",
        {"candidates": candidates})


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