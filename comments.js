document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const commentForm = document.getElementById('comment-form');
    const nameInput = document.getElementById('name');
    const commentInput = document.getElementById('comment');
    const commentsList = document.getElementById('comments-list');
    const submitButton = document.getElementById('submit-comment');
    
    // Fungsi untuk menyimpan komentar ke localStorage
    function saveComment(comment) {
        let comments = getComments();
        comments.push(comment);
        localStorage.setItem('comments', JSON.stringify(comments));
        
    }
    
    // Fungsi untuk mengambil komentar dari localStorage
    function getComments() {
        const comments = localStorage.getItem('comments');
        return comments ? JSON.parse(comments) : [];
    }
    
    // Fungsi untuk menampilkan komentar
    function displayComments() {
        const comments = getComments();
        commentsList.innerHTML = '';
        
        comments.forEach(comment => {
            const li = document.createElement('li');
            li.className = 'comment-item';
            
            const authorDiv = document.createElement('div');
            authorDiv.className = 'comment-author';
            authorDiv.textContent = comment.name;
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'comment-date';
            dateDiv.textContent = new Date(comment.date).toLocaleString();
            
            const textDiv = document.createElement('div');
            textDiv.className = 'comment-text';
            textDiv.textContent = comment.text;
            
            li.appendChild(authorDiv);
            li.appendChild(dateDiv);
            li.appendChild(textDiv);
            
            commentsList.appendChild(li);
        });
    }
    
    // Event listener untuk form submission
    submitButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const text = commentInput.value.trim();
        
        if (name && text) {
            const newComment = {
                name: name,
                text: text,
                date: new Date().toISOString()
            };
            
            saveComment(newComment);
            displayComments();
            
            // Reset form
            nameInput.value = '';
            commentInput.value = '';
        } else {
            alert('Silakan isi nama dan komentar!');
        }
    });
    
    // Tampilkan komentar yang ada saat halaman dimuat
    displayComments();
    
});