from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from users.models import EmailAccount, EmailSubscriptionCandidate
# from users.email_scanner import scan_yandex_email
from .models import Subscription
from .forms import SubscriptionForm
from django.utils import timezone



def home_view(request):
    return render(request, "main/index.html")


def analytics_view(request):
    return render(request, "main/analytics.html")


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
    # emails = scan_yandex_email(
    #     email_account.email,
    #     email_account.password
    # )
    # for e in emails:
    #     EmailSubscriptionCandidate.objects.create(
    #         user=request.user,
    #         subject=e["subject"],
    #         sender=e["sender"],
    #         detected_service=e["sender"]
    #     )
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

        form = SubscriptionForm(initial={
            "name": candidate.detected_service
        })

    return render(
        request,
        "main/create_subscription_from_email.html",
        {
            "form": form,
            "candidate": candidate
        }
    )