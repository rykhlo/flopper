from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Profile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    following = models.ManyToManyField(User, related_name="following")
    followers = models.ManyToManyField(User, related_name="followers")
    image_link = models.CharField(max_length=254, blank=True)
    def serialize(self):
        return {
            "id" : self.id,
            "username" : self.user.username,
            "following" : [user.username for user in self.following.all()],
            "followers" : [user.username for user in self.followers.all()],
            "image" : Profile.objects.get(user=self.user).image_link,
        }

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    text = models.CharField(max_length=280)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="liked_posts")
    def serialize(self):
        return {
            "id" : self.id,
            "author" : self.author.username,
            "text" : self.text,
            "timestamp" : self.timestamp.strftime("%c"),
            "likes" : [user.username for user in self.likes.all()],
            "comments" : [comment.id for comment in self.comments.all()],
            "image" : Profile.objects.get(user=self.author).image_link,
        }

class Comment(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    text = models.CharField(max_length=254)
    timestamp = models.DateTimeField(auto_now_add=True)
    def serialize(self):
        return {
            "id" : self.id,
            "author" : self.author.username,
            "post_id" : self.post.id,
            "text" : self.text,
            "timestamp" : self.timestamp.strftime("%c"),
            "image" : Profile.objects.get(user=self.author).image_link,
        }


