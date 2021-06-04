document.addEventListener("DOMContentLoaded", function () {
    //store user's username
    var username = "";
    var current_page = 1;
    // True if user is logged in
    var isAuthenticated = document.querySelector("#profile-link") !== null;

    // window.onpopstate = function (event) {
    //     showSection(event.state.section);
    // };
    // function showSection(section) {
    //     console.log(section.slice(0, 2));
    //     if (section === "all" || "following") {
    //         load_posts(`${section}`);
    //     } else {
    //         load_profile(`${section}`);
    //     }
    // }

    // By default, load the all posts. Add listeners depending on whether the user is logged in
    //history.pushState({section: "all"}, "", `all`);
    load_posts("all");
    document
        .querySelector("#all_posts-link")
        .addEventListener("click", function () {
            const section = this.dataset.section;
            //history.pushState({section: section}, "", `${section}`);
            load_posts("all");
            return false;
        });

    if (isAuthenticated) {
        username = document.querySelector("#profile-link").innerText;
        document
            .querySelector("#following_posts-link")
            .addEventListener("click", function () {
                const section = this.dataset.section;
                //history.pushState({section: section}, "", `${section}`);
                load_posts("following");
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
                load_profile(username);
                return false;
            });
    }
    // New post submit form
    if (isAuthenticated) {
        document
            .querySelector("#new_post-submit")
            .addEventListener("click", () => {
                fetch("/posts", {
                    method: "POST",
                    body: JSON.stringify({
                        text: document.querySelector("#new_post-text").value,
                    }),
                })
                    .then((response) => response.json())
                    .then((result) => {
                        document.querySelector("#new_post-text").value = ""
                        console.log(result);
                        if (result["error"]) {
                            console.log(result["error"]);
                        } else {
                            load_posts("all");
                        }
                    });
                return false;
            });
    }
    
    function load_posts(post_filter) {
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
                posts.forEach((post) => {
                    generate_post_card(post,post_filter);
                });
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
                        <img class="card__profile-img" src="https://www.syfy.com/sites/syfy/files/styles/1200x680/public/syfywire_cover_media/2018/09/c-3po-see-threepio_68fe125c.jpg" alt="c3po"/>
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
        post_card_displayname.setAttribute("data-section", `u/${post.author}`);
        post_card_displayname.addEventListener("click", function () {
            const section = post_card_displayname.dataset.section;
            //history.pushState({section: section}, "", `${section}`);
            load_profile(post.author);
            return false;
        });
        post_card_text.addEventListener("click", () => {
            $(`#Modal${post.id}`).modal("show")
            return false;
        });
        post_card_displayname.innerHTML = `${post.author}`;
        post_card_username.innerHTML = `@${post.author}`;
        post_card_timestamp.innerHTML = `${post.timestamp}`;
        post_card_text.innerHTML = `${post.text}`;

        // Modal popup
        const post_modal = document.createElement('div')
        Object.assign(post_modal, {
            className: 'modal fade',
            id: `Modal${post.id}`,
            tabindex: '-1',
        })
        post_modal.setAttribute("aria-labelledby", "exampleModalLabel");
        post_modal.setAttribute("aria-hidden", "true");
        post_modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-body">
                        ${post.id}
                    </div>
                    <form id="new_comment-form${post.id}">
                        <h5>New Comment</h5>
                        <textarea class="form-control comment" id="new_comment-text" placeholder="Type here..."></textarea>
                        <button type="button" class="btn btn-primary" id="$new_comment-submit">Submit</button>
                    </form>
                </div>
            </div> 
        `;
        post_modal.getElementsByClassName("modal-body")[0].innerHTML = post_card.innerHTML
        const post_modal_textarea = post_modal.getElementsByClassName(
            "form-control comment"
        )[0];
        const post_modal_submit = post_modal.getElementsByClassName(
            "btn btn-primary"
        )[0];
        post_modal_submit.addEventListener("click", () => {
            $(`#Modal${post.id}`).modal("show")
            return false;
        });
        if (isAuthenticated) {
            post_modal_submit.addEventListener("click", () => {
                fetch(`/post/${post.id}`, {
                    method: "POST",
                    body: JSON.stringify({
                        text: post_modal_textarea.value,
                    }),
                })
                    .then((response) => response.json())
                    .then((result) => {
                        console.log(result);
                        if (result["error"]) {
                            console.log(result["error"]);
                        } else {
                            $(`#Modal${post.id}`).modal("hide")
                            setTimeout(() => {
                                load_posts(post_filter);
                            }, 1000);
                            $(`#Modal${post.id}`).modal("show")
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
                comments.forEach((comment) => {
                    const comment_div = document.createElement("div");
                    comment_div.innerHTML = post_card.innerHTML
                    const comment_div_displayname = comment_div.getElementsByClassName(
                        "card__meta__displayname"
                    )[0];
                    const comment_div_username = comment_div.getElementsByClassName(
                        "card__meta__username"
                    )[0];
                    const comment_div_timestamp = comment_div.getElementsByClassName(
                        "card__meta__timestamp"
                    )[0];
                    const comment_div_text =
                        comment_div.getElementsByClassName("card__body")[0];
                    comment_div_displayname.addEventListener("click", function () {
                        load_profile(post.author);
                        return false;
                    });
                    comment_div_displayname.innerHTML = `${comment.author}`;
                    comment_div_username.innerHTML = `@${comment.author}`;
                    comment_div_timestamp.innerHTML = `${comment.timestamp}`;
                    comment_div_text.innerHTML = `${comment.text}`;
                    post_modal.getElementsByClassName("modal-body")[0].innerHTML += comment_div.innerHTML
                })
        });
        post_card.appendChild(post_modal)        
        document.querySelector("#posts-view").append(post_card);
    }

        

    function load_profile(profile) {
        
        // clear the profile-view
        document.querySelector("#profile-view").innerHTML = "";
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
            src="https://randomuser.me/api/portraits/men/52.jpg"
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
        <div class="profilecard__button">
          <button class="btn btn-outline">
          </button>
        </div>
      </div>
      <hr class="border" />
        <ul class="navlinks">
          <li>Followers: ${data.followers.length}</li>
          <li>Following: ${data.following.length}</li>
        </ul>
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
                load_posts(profile);
            });
    }

    // Follow/Unfollow selected user
    function follow(username) {
        fetch(`/follow/${username}`, {
            method: "PUT",
        })
            .then((response) => response.json())
            .then((result) => {
                console.log(result);
            });
        setTimeout(() => {
            load_profile(username);
        }, 250);
        return false;
    }

    // document.addEventListener("DOMContentLoaded", function () {
    //     document.querySelectorAll("button").forEach((button) => {
    //         button.onclick = function () {
    //             const section = this.dataset.section;
    //             //history.pushState({section: section}, "", `section${section}`);
    //             showSection(section);
    //         };
    //     });
    // });
    function generate_pagination(data, post_filter) {
        // Pagination taken from https://codepen.io/fadzrinmadu/pen/KKWvYqW
        const pagination = document.createElement("div");
        pagination.setAttribute("class", "pagination");
        // selecting required element
        const pagination_ul = document.createElement("ul");
    
        let totalPages = data["num_pages"];
        let page = current_page;
    
        let liTag = "";
        let active;
        let beforePage = page - 1;
        let afterPage = page + 1;
        if (page > 1) {
            //show the next button if the page value is greater than 1
            liTag += `<li class="btn prev"><span><i class="fas fa-angle-left"></i> Prev</span></li>`;
        }
        if (page > 1) {
            //if page value is less than 2 then add 1 after the previous button
            liTag += `<li class="first numb""><span>1</span></li>`;
            if (page > 3) {
                //if page value is greater than 3 then add this (...) after the first li or page
                liTag += `<li class="dots"><span>...</span></li>`;
            }
        }
        // how many pages or li show before the current li
        if (page == totalPages) {
            beforePage = beforePage - 2;
        } else if (page == totalPages - 1) {
            beforePage = beforePage - 1;
        }
        // how many pages or li show after the current li
        if (page == 1) {
            afterPage = afterPage + 2;
        } else if (page == 2) {
            afterPage = afterPage + 1;
        }

        for (var plength = beforePage; plength < afterPage; plength++) {
            if (plength > totalPages) {
                //if plength is greater than totalPage length then continue
                continue;
            }
            if (plength == 0 ) {
                //if plength is 0 than add +1 in plength value
                plength = plength + 1;tive = "";
            }
            liTag += `<li class="numb ${plength}"><span>${plength}</span></li>`;
        }

        if (page < totalPages - 1) {
            //if page value is less than totalPage value by -1 then show the last li or page
            if (page < totalPages - 2) {
                //if page value is less than totalPage value by -2 then add this (...) before the last li or page
                liTag += `<li class="dots"><span>...</span></li>`;
            }
            liTag += `<li class="last numb"><span>${totalPages}</span></li>`;
        }

        if (page < totalPages) {
            //show the next button if the page value is less than totalPage(20)
            liTag += `<li class="btn next"><span>Next <i class="fas fa-angle-right"></i></span></li>`;
        }
        pagination_ul.innerHTML = liTag; //add li tag inside ul tag
        pagination.appendChild(pagination_ul);

        const active_num = pagination.getElementsByClassName(
            `${current_page}`
        )[0];
        active_num.setAttribute("class", "numb active");

        const btn_next = pagination.getElementsByClassName(
            "btn next"
        )[0];
        if (btn_next){
            btn_next.addEventListener("click", function () {
                current_page++
                console.log(current_page)
                load_posts(post_filter)
                return false;
            });
        }
        const btn_prev = pagination.getElementsByClassName(
            "btn prev"
        )[0];
        if (btn_prev){
            btn_prev.addEventListener("click", function () {
                current_page--
                console.log(current_page)
                load_posts(post_filter)
                return false;
            });
        }
        const first_numb = pagination.getElementsByClassName(
            "first numb"
        )[0];
        if (first_numb){
            first_numb.addEventListener("click", function () {
                current_page = 1
                console.log(current_page)
                load_posts(post_filter)
                return false;
            });
        }
        const last_numb = pagination.getElementsByClassName(
            "last numb"
        )[0];
        if (last_numb){
            last_numb.addEventListener("click", function () {
                current_page = totalPages
                console.log(current_page)
                load_posts(post_filter)
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
                    console.log(current_page)
                    load_posts(post_filter)
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
                    console.log(current_page)
                    load_posts(post_filter)
                    return false;
                });
            }
        }  
        return pagination

    }
});


