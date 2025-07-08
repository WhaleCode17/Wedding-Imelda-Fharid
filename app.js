// Konfigurasi Firebase - ganti dengan konfigurasi proyek Anda
const firebaseConfig = {
    apiKey: "AIzaSyATrrjunxIkDlzyFPY9vJwV1PfVMUyd580",
    authDomain: "data-komentar-e687d.firebaseapp.com",
    databaseURL: "https://data-komentar-e687d-default-rtdb.firebaseio.com/",
    projectId: "data-komentar-e687d",
    storageBucket: "data-komentar-e687d.firebasestorage.app",
    messagingSenderId: "887350587723",
    appId: "1:887350587723:web:c861e3cebc7926565838ce"
};


// Inisialisasi Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Elemen DOM
        const commentForm = document.getElementById('commentForm');
        const nameInput = document.getElementById('name');
        const commentInput = document.getElementById('comment');
        const commentList = document.getElementById('commentList');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');

        // Variabel untuk pagination
        const INITIAL_COMMENTS = 3; // Tampilkan 3 komentar pertama
        const COMMENTS_PER_LOAD = 3; // Tampilkan 3 komentar setiap load more
        let lastCommentKey = null;
        let allCommentsLoaded = false;
        let initialLoadComplete = false;

        // Format tanggal
        function formatDate(timestamp) {
            const date = new Date(timestamp);
            const options = { 
                day: 'numeric',
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('id-ID', options);
        }

        // Kirim komentar
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = nameInput.value.trim();
            const commentText = commentInput.value.trim();
            
            if (name && commentText) {
                const submitBtn = commentForm.querySelector('button');
                const originalText = submitBtn.innerHTML;
                
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
                submitBtn.disabled = true;
                
                const comment = {
                    name: name,
                    text: commentText,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                
                database.ref('comments').push(comment)
                    .then(() => {
                        nameInput.value = '';
                        commentInput.value = '';
                        // Reset pagination setelah komentar baru ditambahkan
                        lastCommentKey = null;
                        allCommentsLoaded = false;
                        initialLoadComplete = false;
                        commentList.innerHTML = '';
                        loadInitialComments();
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                        alert("Gagal mengirim komentar. Silakan coba lagi.");
                    })
                    .finally(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    });
            }
        });

        // Fungsi untuk memuat komentar awal (3 komentar pertama)
        function loadInitialComments() {
            loadingIndicator.style.display = 'block';
            loadMoreBtn.style.display = 'none';
            
            database.ref('comments')
                .orderByChild('timestamp')
                .limitToLast(INITIAL_COMMENTS)
                .once('value')
                .then((snapshot) => {
                    const comments = [];
                    snapshot.forEach((childSnapshot) => {
                        comments.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    
                    // Urutkan dari yang terbaru ke terlama
                    comments.sort((a, b) => b.timestamp - a.timestamp);
                    
                    // Simpan key komentar terakhir untuk query berikutnya
                    if (comments.length > 0) {
                        lastCommentKey = comments[comments.length - 1].timestamp;
                    }
                    
                    // Tampilkan komentar
                    displayComments(comments);
                    
                    // Periksa apakah masih ada komentar yang bisa dimuat
                    checkRemainingComments();
                    
                    initialLoadComplete = true;
                })
                .catch((error) => {
                    console.error("Error memuat komentar:", error);
                    commentList.innerHTML = '<div class="no-comments">Gagal memuat komentar. Silakan refresh halaman.</div>';
                })
                .finally(() => {
                    loadingIndicator.style.display = 'none';
                });
        }

        // Fungsi untuk memuat komentar tambahan
        function loadMoreComments() {
            loadingIndicator.style.display = 'block';
            loadMoreBtn.style.display = 'none';
            
            database.ref('comments')
                .orderByChild('timestamp')
                .endBefore(lastCommentKey)
                .limitToLast(COMMENTS_PER_LOAD)
                .once('value')
                .then((snapshot) => {
                    const comments = [];
                    snapshot.forEach((childSnapshot) => {
                        comments.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    
                    // Periksa apakah masih ada data yang bisa dimuat
                    if (comments.length < COMMENTS_PER_LOAD) {
                        allCommentsLoaded = true;
                        loadMoreBtn.style.display = 'none';
                    } else {
                        loadMoreBtn.style.display = 'block';
                    }
                    
                    // Simpan key komentar terakhir untuk query berikutnya
                    if (comments.length > 0) {
                        lastCommentKey = comments[comments.length - 1].timestamp;
                    }
                    
                    // Urutkan dari yang terbaru ke terlama
                    comments.sort((a, b) => b.timestamp - a.timestamp);
                    
                    // Tampilkan komentar
                    displayComments(comments);
                })
                .catch((error) => {
                    console.error("Error memuat komentar:", error);
                    alert("Gagal memuat komentar tambahan. Silakan coba lagi.");
                })
                .finally(() => {
                    loadingIndicator.style.display = 'none';
                });
        }

        // Fungsi untuk mengecek apakah masih ada komentar yang belum dimuat
        function checkRemainingComments() {
            database.ref('comments')
                .orderByChild('timestamp')
                .endBefore(lastCommentKey)
                .limitToLast(1)
                .once('value')
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        loadMoreBtn.style.display = 'block';
                    } else {
                        allCommentsLoaded = true;
                        loadMoreBtn.style.display = 'none';
                    }
                });
        }

        // Fungsi untuk menampilkan komentar
        function displayComments(comments) {
            if (comments.length === 0 && commentList.children.length === 0) {
                commentList.innerHTML = '<div class="no-comments">Belum ada komentar. Jadilah yang pertama berkomentar!</div>';
                return;
            }
            
            comments.forEach(comment => {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                commentItem.innerHTML = `
                    <div class="">
                        <div class="comment-author" style="color: darkgoldenrod; font-family: 'Times New Roman', Times, serif;">
                            <i class="fas fa-user-circle"></i> ${comment.name}
                        </div>
                        <div class="comment-date" style="color: darkgoldenrod; font-family: 'Times New Roman', Times, serif;">
                            <i class="far fa-clock"></i> ${formatDate(comment.timestamp)}
                        </div>
                    </div>
                    <div class="comment-content">
                        ${comment.text}
                    </div>
                    <div class="comment-actions">
                        
                    </div>
                `;
                commentList.appendChild(commentItem);
            });
            
            // Tambahkan event listener untuk tombol hapus baru
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const commentId = e.currentTarget.getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus komentar ini?')) {
                        database.ref('comments/' + commentId).remove()
                            .then(() => {
                                // Refresh komentar setelah menghapus
                                lastCommentKey = null;
                                allCommentsLoaded = false;
                                initialLoadComplete = false;
                                commentList.innerHTML = '';
                                loadInitialComments();
                            })
                            .catch(error => {
                                console.error("Error:", error);
                                alert("Gagal menghapus komentar.");
                            });
                    }
                });
            });
        }

        // Tombol Load More
        loadMoreBtn.addEventListener('click', loadMoreComments);

        // Muat komentar pertama kali
        loadInitialComments();

// // Inisialisasi Firebase
// firebase.initializeApp(firebaseConfig);
// const database = firebase.database();

// // Referensi ke koleksi komentar di Firebase
// const commentsRef = database.ref('comments');

// // Form komentar
// const commentForm = document.getElementById('comment-form');
// const nameInput = document.getElementById('name');
// const commentInput = document.getElementById('comment');
// const commentsContainer = document.getElementById('comments-container');

// // Mendengarkan pengiriman form
// commentForm.addEventListener('submit', (e) => {
//     e.preventDefault();
    
//     const name = nameInput.value.trim();
//     const commentText = commentInput.value.trim();
    
//     if (name && commentText) {
//         // Buat objek komentar
//         const comment = {
//             name: name,
//             text: commentText,
//             timestamp: firebase.database.ServerValue.TIMESTAMP
//         };
        
//         // Simpan ke Firebase
//         commentsRef.push(comment)
//             .then(() => {
//                 // Kosongkan form setelah berhasil disimpan
//                 nameInput.value = '';
//                 commentInput.value = '';
//             })
//             .catch((error) => {
//                 console.error("Error menyimpan komentar: ", error);
//                 alert("Terjadi kesalahan saat menyimpan komentar.");
//             });
//     }
// });

// // Mendengarkan perubahan data komentar
// commentsRef.on('value', (snapshot) => {
//     commentsContainer.innerHTML = ''; // Kosongkan container
    
//     const comments = snapshot.val();
    
//     if (comments) {
//         // Konversi objek ke array dan urutkan berdasarkan timestamp
//         const commentsArray = Object.entries(comments).map(([key, value]) => ({
//             id: key,
//             ...value
//         })).sort((a, b) => b.timestamp - a.timestamp);
        
//         // Tampilkan setiap komentar
//         commentsArray.forEach(comment => {
//             const commentElement = document.createElement('div');
//             commentElement.className = 'comment';
            
//             const date = new Date(comment.timestamp);
//             const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
//             commentElement.innerHTML = `
//                 <div class="comment-author">${comment.name}</div>
//                 <div class="comment-text">${comment.text}</div>
//                 <div class="comment-date">${dateString}</div>
//             `;
            
//             commentsContainer.appendChild(commentElement);
//         });
//     } else {
//         commentsContainer.innerHTML = '<p>Belum ada komentar. Jadilah yang pertama!</p>';
//     }
// });

// // Menangani error
// commentsRef.on('child_added', (data) => {
//     // Success handler
// }, (error) => {
//     console.error("Error membaca data: ", error);
//     commentsContainer.innerHTML = '<p>Terjadi kesalahan saat memuat komentar.</p>';
// });

// // // Mendapatkan referensi ke data yang ingin dihapus
// // const ref = firebase.database().ref('path/to/data');

// // // Menghapus data
// // ref.remove()
// //   .then(() => {
// //     console.log("Data berhasil dihapus");
// //   })
// //   .catch((error) => {
// //     console.error("Gagal menghapus data: ", error);
// //   });