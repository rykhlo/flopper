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
        const post_card = document.createElement('div')
        post_card.setAttribute("class", "card")
        post_card.setAttribute("style", "width: 18rem;")

        const post_author = document.createElement("h5");
        post_author.setAttribute("class", "card-title");
        //post_author.className = ("card-title");
        post_author.innerHTML = `${post.author} <hr>`
        post_author.addEventListener('click', () => load_profile(post.author))

        const post_text = document.createElement("p");
        Object.assign(post_text, {
            className: 'card-text',
        })
        post_text.innerHTML = `${post.text}`;
        post_text.addEventListener('click', () => $('#exampleModal').modal('show'));

        const post_timestamp = document.createElement("p");
        //post_timestamp.className = ("card-text");
        post_timestamp.setAttribute("class", "card-text");
        post_timestamp.innerHTML = `<small class="text-muted"> ${post.timestamp} </small></p>`

        const post_likes = document.createElement("div");
        post_likes.innerHTML = `likes TODO`;

        const post_edit = document.createElement("div");
        post_edit.innerHTML = `edit TODO`;

        /// POST MODAL ///
        const post_modal = document.createElement('div')
        Object.assign(post_modal, {
            className: 'modal fade',
            id: 'exampleModal',
            tabindex: '-1',
        })
        post_modal.setAttribute("aria-labelledby", "exampleModalLabel");
        post_modal.setAttribute("aria-hidden", "true");

        const post_modal_dialog = document.createElement('div');
        Object.assign(post_modal_dialog, {
            className: 'modal-dialog',
        })

        const post_modal_content = document.createElement('div');
        Object.assign(post_modal_content, {
            className: 'modal-content',
        })

        const post_modal_header= document.createElement('div');
        Object.assign(post_modal_header, {
            className: 'modal-header',
        })
        post_modal_header.innerHTML = `<h5 class="modal-title" id="exampleModalLabel">Modal title</h5>`

        const post_modal_body = document.createElement('div');
        Object.assign(post_modal_body, {
            className: 'card',
        })
        $('#exampleModal').on('shown.bs.modal', function() {
            $('#exampleModal').find('.modal-body').append('<p>append some html here</p>');
        });
        

        const post_modal_footer= document.createElement('div');
        Object.assign(post_modal_footer, {
            className: 'modal-footer',
        })
        post_modal_footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>`;
        

        [post_modal_header, post_modal_body, post_modal_footer]
            .forEach(element => post_modal_content.appendChild(element));
        post_modal_dialog.appendChild(post_modal_content);
        post_modal.appendChild(post_modal_dialog);

        [post_author, post_text, post_timestamp, post_likes, post_edit, post_modal]
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