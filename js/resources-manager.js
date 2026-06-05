// Resources Manager - Full Functionality with Firebase

// Check if Firebase is initialized
console.log('🔍 Checking Firebase initialization...');
console.log('Firebase app:', typeof firebase !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');
console.log('Firestore (db):', typeof db !== 'undefined' ? '✅ Available' : '❌ Not available');
console.log('Auth:', typeof auth !== 'undefined' ? '✅ Available' : '❌ Not available');
console.log('Storage:', typeof firebase.storage !== 'undefined' ? '✅ Available' : '❌ Not available');

// Check authentication status
firebase.auth().onAuthStateChanged((user) => {
    const authCheck = document.getElementById('auth-check');
    const resourcesContent = document.getElementById('resources-content');
    const uploadBtn = document.getElementById('upload-btn');

    if (user) {
        // User is signed in
        console.log('✅ User authenticated:', user.email);
        authCheck.style.display = 'none';
        resourcesContent.style.display = 'block';
        uploadBtn.style.display = 'block';

        // Load resources
        loadResourceCounts();
        loadUserGroups();
        loadUserSubscriptions();
    } else {
        // User is not signed in
        console.log('❌ User not authenticated');
        authCheck.style.display = 'block';
        resourcesContent.style.display = 'none';
        uploadBtn.style.display = 'none';
    }
});

// Load resource counts for each category
function loadResourceCounts() {
    const categories = ['books', 'pyq', 'notes', 'mentor', 'interview', 'project', 'premium', 'private'];

    categories.forEach(category => {
        // Query Firestore for count
        db.collection('resources')
            .where('category', '==', category)
            .get()
            .then((querySnapshot) => {
                const count = querySnapshot.size;
                const countElement = document.getElementById(`${category}-count`);
                if (countElement) {
                    countElement.textContent = `${count} ${count === 1 ? 'resource' : 'resources'}`;
                }
            })
            .catch((error) => {
                console.error(`Error loading ${category} count:`, error);
                const countElement = document.getElementById(`${category}-count`);
                if (countElement) {
                    countElement.textContent = '0 resources';
                }
            });
    });
}

// Load user's groups for private resource access
function loadUserGroups() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Query user's groups
    db.collection('users')
        .doc(user.uid)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const groups = userData.groups || [];

                // Populate group dropdown
                const groupSelect = document.getElementById('groupId');
                if (groupSelect) {
                    groupSelect.innerHTML = '<option value="">Select group...</option>';
                    groups.forEach(group => {
                        const option = document.createElement('option');
                        option.value = group.id;
                        option.textContent = group.name;
                        groupSelect.appendChild(option);
                    });
                }
            }
        })
        .catch((error) => {
            console.error('Error loading user groups:', error);
        });
}

// Load user's subscriptions
function loadUserSubscriptions() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('subscriptions')
        .where('userId', '==', user.uid)
        .where('status', '==', 'active')
        .get()
        .then((querySnapshot) => {
            const subscriptions = [];
            querySnapshot.forEach((doc) => {
                subscriptions.push({ id: doc.id, ...doc.data() });
            });
            console.log('Active subscriptions:', subscriptions.length);
            // Store in localStorage for quick access
            localStorage.setItem('userSubscriptions', JSON.stringify(subscriptions));
        })
        .catch((error) => {
            console.error('Error loading subscriptions:', error);
        });
}

// Upload resource to Firebase Storage and Firestore
async function uploadResource() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in to upload resources');
        return;
    }

    // Get form values
    const category = document.getElementById('category').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const fileInput = document.getElementById('file');
    const accessType = document.getElementById('accessType').value;
    const groupId = document.getElementById('groupId').value;
    const tagsInput = document.getElementById('tags').value;

    // Validation
    if (!category || !title || !fileInput.files[0]) {
        alert('Please fill in all required fields');
        return;
    }

    if (accessType === 'private' && !groupId) {
        alert('Please select a group for private resources');
        return;
    }

    const file = fileInput.files[0];
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);

    try {
        // Show loading state
        const uploadButton = document.querySelector('#uploadModal .btn-primary');
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';

        // Upload file to Firebase Storage
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`resources/${category}/${Date.now()}_${file.name}`);

        const uploadTask = await fileRef.put(file);
        const fileUrl = await uploadTask.ref.getDownloadURL();

        // Save metadata to Firestore
        await db.collection('resources').add({
            title: title,
            description: description,
            category: category,
            fileUrl: fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadedBy: user.uid,
            uploaderName: user.displayName || user.email,
            uploaderEmail: user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            accessType: accessType,
            groupId: accessType === 'private' ? groupId : null,
            tags: tags,
            downloads: 0,
            views: 0,
            isPurchasable: category === 'books' || category === 'premium',
            price: category === 'premium' ? 99 : 0,
            isIssuable: category === 'books',
            isSubscribable: category === 'notes' || category === 'mentor'
        });

        // Success!
        alert('✅ Resource uploaded successfully!');

        // Reset form
        document.getElementById('uploadForm').reset();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
        modal.hide();

        // Reload counts
        loadResourceCounts();

        // Reset button
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload';

    } catch (error) {
        console.error('Upload error:', error);
        alert('❌ Upload failed: ' + error.message);

        // Reset button
        const uploadButton = document.querySelector('#uploadModal .btn-primary');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload';
    }
}

// View resources in a specific category
function viewCategory(category) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in to view resources');
        return;
    }

    // Show loading
    const content = document.getElementById('resources-content');
    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading ${category} resources...</p>
        </div>
    `;

    // Load resources from Firestore
    db.collection('resources')
        .where('category', '==', category)
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            const resources = [];
            querySnapshot.forEach((doc) => {
                resources.push({ id: doc.id, ...doc.data() });
            });

            displayResourceList(category, resources);
        })
        .catch((error) => {
            console.error('Error loading resources:', error);
            alert('Failed to load resources: ' + error.message);
            location.reload();
        });
}

// Display resource list
function displayResourceList(category, resources) {
    const user = firebase.auth().currentUser;
    const content = document.getElementById('resources-content');

    const categoryNames = {
        books: 'Books',
        pyq: 'Previous Year Questions',
        notes: 'Notes',
        mentor: 'Mentor Files',
        interview: 'Interview Prep',
        project: 'Project-Based',
        premium: 'Premium Content',
        private: 'Private Materials'
    };

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <button class="btn btn-secondary" onclick="location.reload()">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2 class="d-inline-block ms-3">${categoryNames[category]}</h2>
            </div>
            <span class="badge bg-primary">${resources.length} resources</span>
        </div>
    `;

    if (resources.length === 0) {
        html += `
            <div class="text-center py-5">
                <i class="fas fa-folder-open fa-4x text-secondary mb-3"></i>
                <p class="text-secondary">No resources found in this category</p>
            </div>
        `;
    } else {
        html += '<div class="row g-4">';
        resources.forEach(resource => {
            const canDelete = resource.uploadedBy === user.uid;
            const isPurchasable = resource.isPurchasable && !resource.purchased;
            const isIssuable = resource.isIssuable;
            const isSubscribable = resource.isSubscribable;

            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card glass-card hover-3d h-100">
                        <div class="card-body">
                            <h5 class="card-title">${resource.title}</h5>
                            <p class="card-text text-secondary small">${resource.description || 'No description'}</p>
                            <div class="mb-2">
                                <small class="text-muted">
                                    <i class="fas fa-user"></i> ${resource.uploaderName}
                                </small>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">
                                    <i class="fas fa-download"></i> ${resource.downloads || 0} downloads
                                </small>
                            </div>
                            ${resource.tags && resource.tags.length > 0 ? `
                                <div class="mb-3">
                                    ${resource.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                                </div>
                            ` : ''}
                            <div class="d-flex gap-2 flex-wrap">
                                <button class="btn btn-sm btn-primary" onclick="downloadResource('${resource.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                ${isPurchasable ? `
                                    <button class="btn btn-sm btn-success" onclick="purchaseResource('${resource.id}')">
                                        <i class="fas fa-shopping-cart"></i> Purchase
                                    </button>
                                ` : ''}
                                ${isIssuable ? `
                                    <button class="btn btn-sm btn-warning" onclick="issueResource('${resource.id}')">
                                        <i class="fas fa-clock"></i> Issue
                                    </button>
                                ` : ''}
                                ${isSubscribable ? `
                                    <button class="btn btn-sm btn-info" onclick="subscribeResource('${resource.id}')">
                                        <i class="fas fa-bell"></i> Subscribe
                                    </button>
                                ` : ''}
                                ${canDelete ? `
                                    <button class="btn btn-sm btn-danger" onclick="deleteResource('${resource.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    content.innerHTML = html;
}

// Download resource
async function downloadResource(resourceId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in to download resources');
        return;
    }

    try {
        // Get resource data
        const doc = await db.collection('resources').doc(resourceId).get();

        if (!doc.exists) {
            alert('Resource not found');
            return;
        }

        const resource = doc.data();

        // Increment download count
        await db.collection('resources').doc(resourceId).update({
            downloads: firebase.firestore.FieldValue.increment(1)
        });

        // Open file in new tab
        window.open(resource.fileUrl, '_blank');

        // Update UI
        alert('✅ Download started!');

    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download resource: ' + error.message);
    }
}

// Purchase resource
async function purchaseResource(resourceId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in');
        return;
    }

    if (!confirm('Purchase this resource? (No payment required for demo)')) {
        return;
    }

    try {
        // Add to user's purchases
        await db.collection('purchases').add({
            userId: user.uid,
            resourceId: resourceId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });

        alert('✅ Resource purchased successfully!');

        // Reload to update UI
        const doc = await db.collection('resources').doc(resourceId).get();
        if (doc.exists) {
            viewCategory(doc.data().category);
        }

    } catch (error) {
        console.error('Purchase error:', error);
        alert('Failed to purchase: ' + error.message);
    }
}

// Issue resource temporarily
async function issueResource(resourceId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in');
        return;
    }

    const days = prompt('Issue for how many days?', '7');
    if (!days) return;

    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));

        // Add to user's issued resources
        await db.collection('issued').add({
            userId: user.uid,
            resourceId: resourceId,
            issuedAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiresAt: firebase.firestore.Timestamp.fromDate(expiryDate),
            status: 'active'
        });

        alert(`✅ Resource issued for ${days} days!`);

    } catch (error) {
        console.error('Issue error:', error);
        alert('Failed to issue: ' + error.message);
    }
}

// Subscribe to resource updates
async function subscribeResource(resourceId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in');
        return;
    }

    try {
        // Check if already subscribed
        const existing = await db.collection('subscriptions')
            .where('userId', '==', user.uid)
            .where('resourceId', '==', resourceId)
            .where('status', '==', 'active')
            .get();

        if (!existing.empty) {
            alert('You are already subscribed to this resource');
            return;
        }

        // Add subscription
        await db.collection('subscriptions').add({
            userId: user.uid,
            resourceId: resourceId,
            subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });

        alert('✅ Subscribed successfully! You will be notified of updates.');

    } catch (error) {
        console.error('Subscribe error:', error);
        alert('Failed to subscribe: ' + error.message);
    }
}

// Delete resource (only by uploader)
async function deleteResource(resourceId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in');
        return;
    }

    if (!confirm('Are you sure you want to delete this resource?')) {
        return;
    }

    try {
        // Get resource data
        const doc = await db.collection('resources').doc(resourceId).get();

        if (!doc.exists) {
            alert('Resource not found');
            return;
        }

        const resource = doc.data();

        // Check if user is the uploader
        if (resource.uploadedBy !== user.uid) {
            alert('You can only delete your own resources');
            return;
        }

        // Delete from Storage
        const storageRef = firebase.storage().refFromURL(resource.fileUrl);
        await storageRef.delete();

        // Delete from Firestore
        await db.collection('resources').doc(resourceId).delete();

        alert('✅ Resource deleted successfully');

        // Reload category view
        viewCategory(resource.category);

    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete resource: ' + error.message);
    }
}

console.log('📚 Resources Manager loaded - Full functionality enabled');
