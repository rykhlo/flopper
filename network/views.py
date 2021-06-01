import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

#TODO remove csrf_exempt and implement csrf tokens
from django.views.decorators.csrf import csrf_exempt 

from .models import User, Profile, Post, Comment


def index(request):
    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required(login_url='/login')
def new_post(request):
    # new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
        
    # Get contents of post
    data = json.loads(request.body)  
    text = data.get("text")
    # Check if new post is not empty
    if text == "":
        return JsonResponse({
            "error": "New post cannot be empty"
        }, status=400)

    # Save the post 
    post = Post(
        author=request.user,
        text=text,
    )
    post.save()
    return JsonResponse({"message": "New post created successfully."}, status=201)

@login_required(login_url='/login')
def posts(request, post_filter):
    #filter posts
    if post_filter == "all":
        posts = Post.objects.all()
    elif post_filter == "following":
        posts = Post.objects.filter(
            #TODO
        )
    else:
        return JsonResponse({"error": "Invalid posts filter."}, status=400)
    #return posts in reverse chronological order
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([post.serialize() for post in posts], safe=False)

