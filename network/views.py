import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator, EmptyPage

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
        if request.POST.get('email'):
            email = request.POST.get('email')
        else:
            email = ''

        # Do not allow usernames that would interfer with the API
        prohibited_usernames = ["all", "following",]
        if username in prohibited_usernames:
            return render(request, "network/register.html", {
                "message": "You cannot choose this username"
            })

        # Ensure password matches confirmation
        password = request.POST["password"]
        # confirmation = request.POST["confirmation"]
        # if password != confirmation:
        #     return render(request, "network/register.html", {
        #         "message": "Passwords must match."
        #     })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
            profile = Profile.objects.create(user=user)
            if request.POST.get('image_link'):
                profile.image_link = request.POST.get('image_link')
            else:
                profile.image_link = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
            profile.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

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

def posts(request, post_filter):
    # Load all posts
    if post_filter == "all":
        posts = Post.objects.all()
    # Load posts of profiles that user follows
    elif post_filter == "following":
        try:
            user = User.objects.get(username=request.user.username)
            profile = Profile.objects.get(user=user)
            posts = Post.objects.filter(
                author__in=profile.following.all(),
            )
        except User.DoesNotExist:
            return JsonResponse({"error": "Invalid User."}, status=400)
    else: #load posts of a profile with username post_filter
        try:
            user = User.objects.get(username=post_filter)
            posts = Post.objects.filter(
                author=user,
            )
        except User.DoesNotExist:
            return JsonResponse({"error": "Invalid User."}, status=400)

    #return posts in reverse chronological order
    posts = posts.order_by("-timestamp").all()
    p = Paginator(posts, 10)
    page_num = request.GET.get('page', 1)
    try:
        page = p.page(page_num)
    except EmptyPage:
        page = p.page(1)
    json = {
        "posts" : [post.serialize() for post in page],
        #"comments": [post.comments.all() for post in page],
        "num_pages" : p.num_pages,
    }
    return JsonResponse(json, safe=False)


def post(request, post_id):
    # Fetch post comments only with GET method
    if request.method == "GET":
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Invalid Post ID."}, status=400) 
        jsonData = {
            "comments" : [comment.serialize() for comment in post.comments.all()],
            "post" : post.serialize(),
            "image" : Profile.objects.get(user=post.author).image_link
        }
        return JsonResponse(jsonData, safe=False)
    if request.method == "POST":
        # Get contents of comment
        data = json.loads(request.body)  
        text = data.get("text")
        # Check if new comment is not empty
        if text == "":
            return JsonResponse({
                "error": "New comment cannot be empty"
            }, status=400)

        # Save the coment 
        comment = Comment(
            author=request.user,
            text=text,
            post=Post.objects.get(pk=post_id),
        )
        comment.save()
        return JsonResponse({"message": "New comment created successfully."}, status=201)

    # PUT method for post likes
    if request.method == "PUT": 
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Invalid Post ID."}, status=400)
        data = json.loads(request.body)
        message = ""
        if data.get("liked") is not None:
            if (request.user in post.likes.all()):
                post.likes.remove(request.user)
                message = f"Post {post_id} unliked by {request.user.username} "
            else:
                post.likes.add(request.user)
                message = f"Post {post_id} liked by {request.user.username} "
            post.save()
        if data.get("edit") is not None:
            post.text = data["edit"]
            post.save()
            message = f"Post {post_id} has been edited successfully"
        
        return JsonResponse({"message": message}, status=201)


@login_required(login_url='/login')
def profile(request, username):
    #try to load user from the database
    try:
        user = User.objects.get(username=username)
        profile = Profile.objects.get(user=user)
    except User.DoesNotExist or Profile.DoesNotExist:
        return JsonResponse({"error": f"Invalid User with username ({username})"}, status=400)
    
    #return object with profile info
    return JsonResponse(profile.serialize())

    
@login_required(login_url='/login')
def follow(request,username):
    #Only accepts PUT requests
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    # Load the user and profile of the account who sent the follow request
    try:
        follows_user = User.objects.get(username=request.user.username)
        follows_profile = Profile.objects.get(user=follows_user)
    except User.DoesNotExist or Profile.DoesNotExist:
        return JsonResponse({"error": "Request user is not valid"}, status=400)       

    # Load the user and profile of the account that is being followed 
    try:
        followed_user = User.objects.get(username=username)
        followed_profile = Profile.objects.get(user=followed_user)
    except User.DoesNotExist or Profile.DoesNotExist:
        return JsonResponse({"error": f"Unable to follow user {username}. Invalid profile."}, status=400)
    
    # If follower already exists, remove the follower
    message = ""
    if followed_user in follows_profile.following.all() or follows_user in followed_profile.followers.all():
        follows_profile.following.remove(followed_user)
        followed_profile.followers.remove(follows_user)
        message = "Follower removed successfully"
    else: #if follower does not exist, add the follower
        follows_profile.following.add(followed_user)
        followed_profile.followers.add(follows_user)
        message = "Follower added successfully"
    follows_profile.save()
    followed_profile.save()
    return JsonResponse({"message": message}, status=201)



