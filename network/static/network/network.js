document.addEventListener('DOMContentLoaded', function() {
    //store user's username
    var username = "";
    // By default, load the all posts
    load_posts('all');
    // True if user is logged in
    var isAuthenticated = document.querySelector('#profile-link') !== null;

    // Use buttons to toggle between views
    document.querySelector('#all_posts-link').addEventListener('click', () => load_posts('all'));
    //check if user if logged in
    if (isAuthenticated){
        username = document.querySelector('#profile-link').innerText;
        document.querySelector('#following_posts-link').addEventListener('click', () => load_posts('following'));
        document.querySelector('#profile-link').addEventListener('click', () => load_profile(username));    
    }

    // New post submit form listener 
    if (isAuthenticated){
        document.querySelector('#new_post-submit').addEventListener('click', () => {   
            fetch('/posts', {
            method: 'POST',
            body: JSON.stringify({
                text: document.querySelector('#new_post-text').value,
            })
            })
            .then(response => response.json())
            .then(result => {
            console.log(result);
            if (result["error"]) {
                console.log(result["error"]);
            }
            else {
                // TODO redirect
            }
            });
        return false;
        });
    }

    function load_posts(post_filter) {
        // clear the posts-view
        document.querySelector('#posts-view').innerHTML = ''

        // Display New Post form only for authenticated users in all posts tab
        document.querySelector('#posts-view').style.display = 'block';
        if (isAuthenticated && post_filter === "all"){
            document.querySelector('#new_post-view').style.display = 'block';
        } else if (isAuthenticated){
            document.querySelector('#new_post-view').style.display = 'none';
        }

        // Show the title 
        if (post_filter === "all"){
            document.querySelector('#profile-view').style.display = 'none';
            document.querySelector('#posts-view').innerHTML = '<h3>All Posts</h3>'
        }
        else if (post_filter === "following"){
            document.querySelector('#profile-view').style.display = 'none';
            document.querySelector('#posts-view').innerHTML = '<h3>Following</h3>'        
        }
        else if (post_filter === "profile"){
            // const user_posts_title = document.createElement("h3");
            // user_posts_title.innerHTML = `<h3> ${username}'s Posts</h3>`;
            // document.querySelector("#posts-view").append(user_posts_title);
            document.querySelector('#posts-view').innerHTML = `<h3> ${username}'s Posts</h3>`;      
        }

        // Fetch posts based on filter
        fetch(`posts/${post_filter}`)
        .then(response => response.json())
        .then(posts => {
            posts.forEach(post => { 
                generate_post_card(post);                  
            })
        })
    }

    function generate_post_card(post){
        const post_card = document.createElement('div')
        post_card.setAttribute("class", "card")
        post_card.setAttribute("style", "width: 18rem;")

        const post_author = document.createElement("h5");
        post_author.setAttribute("class", "card-title");
        //post_author.className = ("card-title");
        post_author.innerHTML = `${post.author} <hr>`
        post_author.addEventListener('click', () => load_profile(post.author))

        const post_text = document.createElement("p");
        //post_text.className = ("card-text");
        post_text.setAttribute("class", "card-text");
        post_text.innerHTML = `${post.text}`;

        const post_timestamp = document.createElement("p");
        //post_timestamp.className = ("card-text");
        post_timestamp.setAttribute("class", "card-text");
        post_timestamp.innerHTML = `<small class="text-muted"> ${post.timestamp} </small></p>`

        const post_likes = document.createElement("div");
        post_likes.innerHTML = `likes TODO`;

        const post_edit = document.createElement("div");
        post_edit.innerHTML = `edit TODO`;

        // post_card.innerHTML = `
        // <div class="card-body">
        //     <h5 class="card-title">${post.author}</h5>
        //     <p class="card-text">${post.text}</p>
        //     <p class="card-text"><small class="text-muted"> ${post.timestamp} </small></p>
        //     <a href="#" class="card-link">Like TODO</a>
        //     <a href="#" class="card-link">Edit TODO</a>
        // </div>
        // `;

        [post_author, post_text, post_timestamp, post_likes, post_edit]
            .forEach(element => post_card.appendChild(element));
        
        document.querySelector("#posts-view").append(post_card);     
    }

    function load_profile(profile) {
        // clear the profile-view
        document.querySelector('#profile-view').innerHTML = ''
        document.querySelector('#profile-view').style.display = 'block';

        fetch(`/profile/${profile}`)
        .then(response => response.json())
        .then(data => {
            // Create a card that displays followers info
            const followers_card = document.createElement("div");
            followers_card.setAttribute("class", "card");
            followers_card.setAttribute("style", "width: 18rem;");
            followers_card.innerHTML = `
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>${data.username}</strong></li>
                    <li class="list-group-item">Followers: ${data.followers.length}</li>
                    <li class="list-group-item">Following: ${data.following.length}</li>
                </ul>
            `;
            // Display follow button if profile is not user's
            if (username != profile){
                const follow_button = document.createElement("button");
                follow_button.className = "btn btn-outline-secondary";
                follow_button.innerHTML = `${data.followers.includes(username) ? "Unfollow" : "Follow"}`
                follow_button.onclick = () => put_follower(username, data.username);
                document.getElementById('profile-view').appendChild(follow_button);
            }

            document.querySelector("#profile-view").append(followers_card); 
            // Add title for posts
            const user_posts_title = document.createElement("h3");
            user_posts_title.innerHTML = `<h3> ${profile}'s Posts</h3>`;
            document.querySelector("#profile-view").append(user_posts_title);
            // Load posts of the specified profile
            load_posts(profile);
        })      
    }

    // make whom be a follower of where
    function put_follower(whom, where){
        console.log("follower time")
        fetch(`/profile/${where}`, {
            method: 'PUT',
            body: JSON.stringify({
                followers: [whom],
            }),
        })
    }
  
});