document.addEventListener('DOMContentLoaded', function() {
    //store user's username
    var username = "";
    // True if user is logged in
    var isAuthenticated = document.querySelector('#profile-link') !== null;

    // By default, load the all posts. Add listeners depending on whether the user is logged in
    load_posts('all');
    document.querySelector('#all_posts-link').addEventListener('click', () => load_posts('all'));
    if (isAuthenticated){
        username = document.querySelector('#profile-link').innerText;
        document.querySelector('#following_posts-link').addEventListener('click', () => load_posts('following'));
        document.querySelector('#profile-link').addEventListener('click', () => load_profile(username));    
    }
    // New post submit form 
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

        const post_card = document.createElement('div');
        post_card.setAttribute("class", "wrapper");
        post_card.setAttribute("id", "post-card");
        // Taken from https://codepen.io/markbaker/pen/QWbQVKo
        post_card.innerHTML = `
            <ul class="cards__list">
                <li class="card">
                    <div class="card__header">
                        <img class="card__profile-img" src="https://www.syfy.com/sites/syfy/files/styles/1200x680/public/syfywire_cover_media/2018/09/c-3po-see-threepio_68fe125c.jpg" alt="c3po"/>
                    <div class="card__meta">
                        <div class="card__meta__displayname">
                        C-3PO
                        </div>
                        <div class="card__meta__username">
                        @humancyborgrelations
                        </div>
                        <div class="card__meta__timestamp">
                        1 day ago
                        </div>
                    </div>
                    </div>
                    <div class="card__body">
                        I have a bad feeling about this!
                    </div>
                    <div class="card__footer">
                        <span class="card__footer__like">
                        <i class="far fa-heart"></i> 13
                        </span>
                        <span class="card__footer__comment">
                        <i class="far fa-comment"></i> 2
                        </span>
                        <span class="card__footer__share">
                        <i class="fas fa-edit"></i>
                    </div>
                </li>
            </ul>
        `;
        const post_card_displayname = post_card.getElementsByClassName("card__meta__displayname")[0]
        const post_card_username = post_card.getElementsByClassName("card__meta__username")[0]
        const post_card_timestamp = post_card.getElementsByClassName("card__meta__timestamp")[0]
        const post_card_text = post_card.getElementsByClassName("card__body")[0]
        post_card_displayname.addEventListener('click', () => load_profile(post.author))
        post_card_username.addEventListener('click', () => load_profile(post.author))
        post_card.addEventListener('click', () => load_post(post.id))
        post_card_displayname.innerHTML = `${post.author}`;
        post_card_username.innerHTML = `@${post.author}`;
        post_card_timestamp.innerHTML = `${post.timestamp}`;
        post_card_text.innerHTML = `${post.text}`;
        
        document.querySelector("#posts-view").append(post_card);     
    }

    function load_post(post_id) {
        // clear the posts-view
        document.querySelector('#posts-view').innerHTML = '';
        if (isAuthenticated){
            document.querySelector('#new_post-view').style.display = 'none';
        }
        // Fetch post 
        fetch(`post/${post_id}`)
        .then(response => response.json())
        .then(post => {
            generate_post_card(post);                  
        })

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
                follow_button.onclick = () => follow(profile);
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

    // Follow/Unfollow selected user
    function follow(username){
        fetch(`/follow/${username}`, {
            method: 'PUT',
        })
        .then(response => response.json())
            .then(result => {
            console.log(result);
            })
        setTimeout(() => {
            load_profile(username)
        }, 250);
        return false;
    }
  
});