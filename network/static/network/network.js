document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#new_post').addEventListener('click', new_post);
  
    // By default, load the inbox
    //load_mailbox('inbox');
  
    function new_post() {
        // Show correct views
        //document.querySelector('#emails-view').style.display = 'none';
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
  
});