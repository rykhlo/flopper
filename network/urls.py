
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("posts", views.new_post, name="new_post"),
    path("posts/<str:post_filter>", views.posts, name="posts"),
    path("profile/<str:username>", views.profile, name="profile"),
]
