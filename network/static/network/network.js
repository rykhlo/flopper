document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all_posts').addEventListener('click', () => load_posts('all'));
    document.querySelector('#following_posts').addEventListener('click', () => load_posts('following'));
    document.querySelector('#new_post').addEventListener('click', new_post);
  
    // By default, load the all posts
    load_posts('all');
  
    function new_post() {
        //TODO add the ability to collide the new_post form 
        // Show correct views
        document.querySelector('#new_post-view').style.display = 'block';

        // Clear out composition fields
        document.querySelector('#new_post-text').value = '';
        
        // Submit form
        document.querySelector('#new_post-form').onsubmit = () => {   
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
        };
    }

    function load_posts(post_filter) {
        // clear the posts-view
        document.querySelector('#posts-view').innerHTML = ''
        // Show the posts view and hide other views
        document.querySelector('#posts-view').style.display = 'block';
        document.querySelector('#new_post-view').style.display = 'none';
      
        // Show the posts filter
        if (post_filter === "all"){
            document.querySelector('#posts-view').innerHTML = '<h3>All Posts</h3>'
        }
        else if (post_filter === "following"){
            document.querySelector('#posts-view').innerHTML = '<h3>Following</h3>'        
        }

        fetch(`posts/${post_filter}`)
        .then(response => response.json())
        .then(posts => {
            posts.forEach(post => { 
                
                const post_card = document.createElement('div')
                post_card.setAttribute("class", "card")
                post_card.setAttribute("style", "width: 18rem;")
                post_card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${post.author}</h5>
                    <p class="card-text">${post.text}</p>
                    <p class="card-text"><small class="text-muted"> ${post.timestamp} </small></p>
                    <a href="#" class="card-link">Like TODO</a>
                    <a href="#" class="card-link">Edit TODO</a>
                </div>
                `;

                document.querySelector("#posts-view").append(post_card);

                
                
            })

        })
    }
  
});