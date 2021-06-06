document.addEventListener("DOMContentLoaded", function () {


    //store user's username
    var username = "";
    var current_page = 1;
    var temp_liked = false; // for checking if the user have liked the post already on the current page load
    // True if user is logged in
    var isAuthenticated = document.querySelector("#profile-link") !== null;

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // By default, load the all posts. Add listeners depending on whether the user is logged in
    //history.pushState({section: "all"}, "", `all`);
    load_posts("all", true);
    document
        .querySelector("#all_posts-link")
        .addEventListener("click", function () {
            const section = this.dataset.section;
            //history.pushState({section: section}, "", `${section}`);
            load_posts("all", true);
            return false;
        });

    if (isAuthenticated) {
        username = document.querySelector("#profile-link").innerText;
        document
            .querySelector("#following_posts-link")
            .addEventListener("click", function () {
                const section = this.dataset.section;
                //history.pushState({section: section}, "", `${section}`);
                load_posts("following", true);
                return false;
            });

        document
            .querySelector("#profile-link")
            .setAttribute("data-section", `${username}`);
        document
            .querySelector("#profile-link")
            .addEventListener("click", function () {
                const section = this.dataset.section;
                //history.pushState({section: section}, "", `${section}`);
                setTimeout(() => {
                    load_profile(username);
                }, 250);
                return false;
            });
    }
    // New post submit form
    if (isAuthenticated) {
        document
            .querySelector("#new_post-submit")
            .addEventListener("click", () => {
                const csrftoken = getCookie('csrftoken');
                fetch("/posts", {
                    method: "POST",
                    body: JSON.stringify({
                        text: document.querySelector("#new_post-text").value,
                    }),
                    headers: { "X-CSRFToken": csrftoken },
                })
                    .then((response) => response.json())
                    .then((result) => {
                        document.querySelector("#new_post-text").value = ""
                        //console.log(result);
                        if (result["error"]) {
                            //console.log(result["error"]);
                        } else {
                            load_posts("all", true);
                        }
                    });
                return false;
            });
    }
    
    function load_posts(post_filter, fromStart) {
        if (fromStart === true){
            current_page = 1
        }
        // clear the posts-view
        document.querySelector("#posts-view").innerHTML = "";

        // Display New Post form only for authenticated users in all posts tab
        document.querySelector("#posts-view").style.display = "block";
        if (isAuthenticated && post_filter === "all") {
            document.querySelector("#new_post-view").style.display = "flex";
        } else if (isAuthenticated) {
            document.querySelector("#new_post-view").style.display = "none";
        }

        // Show the title
        if (post_filter === "all") {
            document.querySelector("#profile-view").style.display = "none";
            document.querySelector("#posts-view").innerHTML =
                '<h3>All Posts</h3> <hr class="heading_border"/>';
        } else if (post_filter === "following") {
            document.querySelector("#profile-view").style.display = "none";
            document.querySelector("#posts-view").innerHTML =
                '<h3>Following</h3><hr class="heading_border"/>';
        }

        // Fetch posts based on filter

        fetch(`posts/${post_filter}?page=${current_page}`)
            .then((response) => response.json())
            .then((data) => {
                posts = data["posts"];
                
                if (typeof posts != 'undefined'){
                    if (posts.length === 0) {
                        document.querySelector("#posts-view").append(`There are no posts yet`)
                    }
                    posts.forEach((post) => {
                        generate_post_card(post,post_filter);
                    });
                }
                const pagination = generate_pagination(data, post_filter);
                document.querySelector("#posts-view").append(pagination);
            });
    }

    function generate_post_card(post, post_filter) {
        const post_card = document.createElement("div");
        post_card.setAttribute("class", "wrapper");
        post_card.setAttribute("id", "post-card");
        // Taken from https://codepen.io/markbaker/pen/QWbQVKo
        post_card.innerHTML = `
            <ul class="cards__list">
                <li class="card hvr-fade">
                    <div class="card__header">
                        <img class="card__profile-img" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" alt="c3po"/>
                    <div class="card__meta">
                        <div class="card__meta__displayname ">
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
                        <span class="card__footer__like" id="card__footer__like#${post.id}">
                        <i class="far fa-heart"></i> 134
                        </span>
                        <span class="card__footer__comment">
                        <i class="far fa-comment"></i> 2
                        </span>
                        <button style="display:none" type="button" class="btn btn-sm btn-outline-secondary edit_submit">Submit Edit</button>
                        <span class="card__footer__edit">
                        <i class="fas fa-edit"></i>
                        </span>
                    </div>
                </li>
            </ul>
        `;

        const post_card_displayname = post_card.getElementsByClassName(
            "card__meta__displayname"
        )[0];
        const post_card_username = post_card.getElementsByClassName(
            "card__meta__username"
        )[0];
        const post_card_timestamp = post_card.getElementsByClassName(
            "card__meta__timestamp"
        )[0];
        const post_card_text =
            post_card.getElementsByClassName("card__body")[0];
        const post_card_comment = post_card.getElementsByClassName(
            "card__footer__comment"
        )[0];
        const post_card_like = post_card.getElementsByClassName(
            "card__footer__like"
        )[0];
        const post_card_edit = post_card.getElementsByClassName(
            "card__footer__edit"
        )[0];
        const post_card_edit_submit = post_card.getElementsByClassName(
            "btn btn-sm btn-outline-secondary edit_submit"
        )[0];
        // if authour is user, add event listener for post edit, else hide
        if (username === post.author){
            post_card_edit.addEventListener("click", () => {
                edit(post, post_card_text, post_card_edit_submit, post_filter)
                return false;
            });
        }
        else {
            post_card_edit.style.display = "none"
        }
        post_card_like.addEventListener("click", () => {
            if (isAuthenticated){
                if (post.likes.includes(username)){
                    like(post, post_filter, true)
                } else {
                    like(post, post_filter, false)
                }  
            }
            else {
                location.href = "/login"
            }
            
            return false;
        });
        post_card_comment.addEventListener("click", () => {
            if (isAuthenticated){
                $(`#Modal${post.id}`).modal("show") 
            }
            else {
                location.href = "/login"
            }
            return false;
        });
        
        post_card_displayname.addEventListener("click", function () {
            if (isAuthenticated){
                load_profile(post.author);
            }
            else {
                location.href = "/login"
            }
            return false;
        });
        // post_card_text.addEventListener("click", () => {
        //     $(`#Modal${post.id}`).modal("show");
        //     false;
        // });
        post_card_displayname.innerHTML = `${post.author}`;
        post_card_username.innerHTML = `@${post.author}`;
        post_card_timestamp.innerHTML = `${post.timestamp}`;
        post_card_text.innerHTML = `${post.text}`;
        post_card_comment.innerHTML = `<i class="far fa-comment"></i> ${post.comments.length}`;
        post_card_like.innerHTML = `<i class="far fa-heart"></i> ${post.likes.length}`;
        if (post.likes.includes(username)){
            post_card_like.innerHTML = `<i class="fas fa-heart"></i> ${post.likes.length}`;
        }

        // Modal popup
        const post_modal = document.createElement('div')
        Object.assign(post_modal, {
            className: 'modal fade',
            id: `Modal${post.id}`,
            // tabindex: '-1',
        })
        // post_modal.setAttribute("aria-labelledby", "exampleModalLabel");
        // post_modal.setAttribute("aria-hidden", "true");
        post_modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close Comments</button>
                    <div class="modal-body">
                        ${post.id}
                    </div>
                    <form class="new_comment-form">
                        <h5>New Comment</h5>
                        <textarea maxlength="280" class="form-control comment" placeholder="Type here..."></textarea>
                        <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" >Submit</button>
                        </div>
                    </form>
                </div>
            </div> 
        `;
        post_modal.getElementsByClassName("modal-body")[0].innerHTML = post_card.innerHTML
        post_modal.getElementsByClassName("card__footer")[0].innerHTML = "<small>Original Poster</small>"
        const post_modal_textarea = post_modal.getElementsByClassName(
            "form-control comment"
        )[0];
        const post_modal_submit = post_modal.getElementsByClassName(
            "btn btn-primary"
        )[0];
        // submit new comment to a post
        if (isAuthenticated) {
            post_modal_submit.addEventListener("click", () => {
                const csrftoken = getCookie('csrftoken');
                fetch(`/post/${post.id}`, {
                    method: "POST",
                    body: JSON.stringify({
                        text: post_modal_textarea.value,
                    }),
                    headers: { "X-CSRFToken": csrftoken },
                })
                    .then((response) => response.json())
                    .then((result) => {
                        //console.log(result);
                        if (result["error"]) {
                            //console.log(result["error"]);
                        } else {
                            //TODO make the modal refresh with the new comment
                            $(`#Modal${post.id}`).modal('hide');
                            load_posts(post_filter, false);
                            
                        }
                    });
                return false;
            });
        }
        // load comments and add them to the modal
        fetch(`post/${post.id}`)
            .then((response) => response.json())
            .then((data) => {
                comments = data["comments"];
                // Update profile pictures
                post_card.getElementsByClassName(
                    "card__profile-img"
                )[0].setAttribute("src", data["image"]);
                post_modal.getElementsByClassName(
                    "card__profile-img"
                )[0].setAttribute("src", data["image"]); 
                comments.forEach((comment) => {
                    const comment_div = generate_comment_div(comment, post, post_card);
                    post_modal.getElementsByClassName("modal-body")[0].appendChild(comment_div)
                })
        });
        post_card.appendChild(post_modal) 
        // update the post image
        document.querySelector("#posts-view").append(post_card);
    }

    function generate_comment_div(comment, post, post_card){
        const comment_div = document.createElement("div");
        comment_div.innerHTML = post_card.innerHTML
        comment_div.getElementsByClassName("card__footer")[0].innerHTML = `replying to ${post.author}`
        const comment_div_displayname = comment_div.getElementsByClassName(
            "card__meta__displayname"
        )[0];
        const comment_div_username = comment_div.getElementsByClassName(
            "card__meta__username"
        )[0];
        const comment_div_timestamp = comment_div.getElementsByClassName(
            "card__meta__timestamp" //
        )[0];
        const comment_div_text =
            comment_div.getElementsByClassName("card__body")[0];
        comment_div_displayname.innerHTML = `${comment.author}`;
        comment_div_username.innerHTML = `@${comment.author}`;
        comment_div_timestamp.innerHTML = `${comment.timestamp}`;
        comment_div_text.innerHTML = `${comment.text}`;
        comment_div.getElementsByClassName(
            "card__profile-img"
        )[0].setAttribute("src", `${comment.image}`); 

        comment_div_displayname.addEventListener("click", function () {
            //console.log("somethinf")
            $(`#Modal${post.id}`).modal('hide');
            load_profile(comment.author);
            return false;
        });
        return comment_div
    }    

    function load_profile(profile) {
        console.log("something")
        // clear the profile-view
        document.querySelector("#profile-view").innerHTML = "";
        document.querySelector("#posts-view").innerHTML = "";
        document.querySelector("#profile-view").style.display = "block";

        fetch(`/profile/${profile}`)
            .then((response) => response.json())
            .then((data) => {
                // Create a card that displays followers info
                const followers_card = document.createElement("div");
                followers_card.setAttribute("class", "profilecard");
                followers_card.innerHTML = `
      <div class="profilecard__header">
        <div class="profilecard__profile">
          <img
            src="${data.image}"
            alt="A man smiling"
          />
        </div>
        <div class="profilecard__name">
          <h2>${data.username}</h2>
          <div class="profilecard__handle">
            <span class="circle"></span>
            <span class="handle">@${data.username}</span>
          </div>
        </div>
        
        </div>
      </div>
      <hr class="border" />
        <ul class="navlinks">
          <li>Followers: 
                ${typeof data.followers === 'undefined' ? 0 : (data.followers.length)}</li>
          <li>Following: 
                ${typeof data.following === 'undefined' ? 0 : (data.following.length)}</li>
        </ul>
        <div class="profilecard__button">
          <button class="btn btn-outline">
          </button>
      </div>
      
            `;
                // Display follow button if profile is not user's
                const follow_button = followers_card.getElementsByClassName("btn btn-outline")[0];
                if (username != profile) {
                    follow_button.innerHTML = `${
                        data.followers.includes(username)
                            ? "Unfollow"
                            : "Follow"
                    }`;
                    follow_button.onclick = () => follow(profile);
                } else {
                    follow_button.setAttribute("style", "display:none")
                }

                document.querySelector("#profile-view").append(followers_card);
                // Add title for posts
                const user_posts_title = document.createElement("h3");
                user_posts_title.innerHTML = `<h3> ${profile}'s Posts</h3> <hr class="heading_border"/>`;
                document
                    .querySelector("#profile-view")
                    .append(user_posts_title);
                // Load posts of the specified profile
                load_posts(profile, true);
            });
            return false
    }

    // Follow/Unfollow selected user
    function follow(username) {
        const csrftoken = getCookie('csrftoken');
        fetch(`/follow/${username}`, {
            method: "PUT",
            headers: { "X-CSRFToken": csrftoken },
        })
            .then((response) => response.json())
            .then((result) => {
                //console.log(result);
            });
            
        setTimeout(() => {
            load_profile(username);
        }, 250);
        return false;
    }
    //Like/ Inlike selected Post
    function like(post, post_filter, isLiked) {
        const csrftoken = getCookie('csrftoken');
        fetch (`/post/${post.id}`, {
            method: "PUT",
            body: JSON.stringify({
                liked: true,
            }),
            headers: { "X-CSRFToken": csrftoken },
        })
            .then((response) => response.json())
            .then((result) => {
                //console.log(result);
            });
            if (isLiked === false){
                if (temp_liked === false){
                    document.getElementById(`card__footer__like#${post.id}`).innerHTML = `<i class="fas fa-heart"></i> ${post.likes.length+1}`;
                    temp_liked = true;
                }
                else {
                    document.getElementById(`card__footer__like#${post.id}`).innerHTML = `<i class="far fa-heart"></i> ${post.likes.length}`;
                    temp_liked = false;
                }
            }
            else {
                if (temp_liked === false){
                    document.getElementById(`card__footer__like#${post.id}`).innerHTML = `<i class="far fa-heart"></i> ${post.likes.length-1}`;
                    temp_liked = true;
                }
                else {
                    document.getElementById(`card__footer__like#${post.id}`).innerHTML = `<i class="fas fa-heart"></i> ${post.likes.length}`;
                    temp_liked = false;
                }             
            }

            

        return false;
    }
    //Like/ Inlike selected Post
    function edit(post, post_card_text, post_card_edit_submit, post_filter) {
        if (post_card_edit_submit.style.display === "block"){
            post_card_text.innerHTML = `${post.text}`;
            post_card_edit_submit.style.display = "none"
            return false
        }
        post_card_text.innerHTML = `<textarea maxlength="280" class="form-control edit" id="new_edit-text" placeholder="Type here..."></textarea>`;
        post_card_text.getElementsByClassName("form-control edit")[0].value = `${post.text}`
        post_card_edit_submit.style.display = ("block")
        if (isAuthenticated) {
            post_card_edit_submit.addEventListener("click", () => {
                const csrftoken = getCookie('csrftoken');
                fetch (`/post/${post.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        edit: post_card_text.getElementsByClassName("form-control edit")[0].value,
                    }),
                    headers: { "X-CSRFToken": csrftoken },
                })
                    .then((response) => response.json())
                    .then((result) => {
                        //console.log(result);
                    });
                post_card_text.innerHTML = `${post.text}`;
                post_card_edit_submit.style.display = ("none")
                setTimeout(() => {
                    load_posts(post_filter, false);
                }, 250);
                return false;
                })
            }
    }

    function generate_pagination(data, post_filter) {
        const pagination = document.createElement("div");
        pagination.setAttribute("class", "pagination");
        // selecting required element
        const pagination_ul = document.createElement("ul");
        let liTag = "";

        var current = current_page,
            last = data["num_pages"],
            delta = 1,
            left = current - delta,
            right = current + delta + 1,
            range = [];
        
        if (current > 1) {
            liTag += `<li class="btn prev"><span><i class="fas fa-angle-left"></i></span></li>`;
        }
        for (let i = 1; i <= last; i++) {
            if (i == 1 || i == last || i >= left && i < right) {
                range.push(i);
                liTag += `<li class="numb ${i}"><span>${i}</span></li>`;               
            }
            if (i == current - delta - 2){
                liTag += `<li class="dots"><span>...</span></li>`;
            }
            if (i == current + 2 && right != last && i != last){
                liTag += `<li class="dots"><span>...</span></li>`;
            }
        }
        if (current < last) {
            liTag += `<li class="btn next"><span><i class="fas fa-angle-right"></i></span></li>`;
        }
        pagination_ul.innerHTML = liTag; //add li tag inside ul tag
        pagination.appendChild(pagination_ul);

        const active_num = pagination.getElementsByClassName(
            `numb ${current_page}`
        )[0];
        if (active_num){
            active_num.setAttribute("class", "numb active");
        }

        const first_numb = pagination.getElementsByClassName(
            "numb 1"
        )[0];
        if (first_numb){
            first_numb.addEventListener("click", function () {
                current_page = 1
                load_posts(post_filter, false)
                return false;
            });
        }
        const last_numb = pagination.getElementsByClassName(
            `numb ${last}`
        )[0];
        if (last_numb){
            last_numb.addEventListener("click", function () {
                current_page = last
                load_posts(post_filter, false)
                return false;
            });
        }
        const btn_next = pagination.getElementsByClassName(
            "btn next"
        )[0];
        if (btn_next){
            btn_next.addEventListener("click", function () {
                current_page++
                load_posts(post_filter, false)
                return false;
            });
        }
        const btn_prev = pagination.getElementsByClassName(
            "btn prev"
        )[0];
        if (btn_prev){
            btn_prev.addEventListener("click", function () {
                current_page--
                load_posts(post_filter, false)
                return false;
            });
        }
        for (let i = 1; i < 4; i++){
            const plus_numb = pagination.getElementsByClassName(
                `numb ${current_page + i}`
            )[0];
            if (plus_numb){
                plus_numb.addEventListener("click", function () {
                    current_page = current_page + i
                    load_posts(post_filter, false)
                    return false;
                });
            }
        }
        for (let i = current_page; i > current_page - 4; i--){
            const minus_numb = pagination.getElementsByClassName(
                `numb ${i}`
            )[0];
            if (minus_numb){
                minus_numb.addEventListener("click", function () {
                    current_page = i
                    load_posts(post_filter, false)
                    return false;
                });
            }
        }  
        return pagination
    }
});

