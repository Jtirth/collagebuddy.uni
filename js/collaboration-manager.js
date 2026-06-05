// Collaboration Manager - Friend Requests & Group Management

// Initialize Firestore reference (assumes firebase-config.js is loaded)
const collaborationDB = firebase.firestore();

// Current user state
let currentUser = null;

// Listen for auth state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        initializeUserProfile();
        loadFriendRequests();
        loadFriends();
        loadGroups();
    }
});

// ============================================
// USER PROFILE MANAGEMENT
// ============================================

async function initializeUserProfile() {
    try {
        const userRef = collaborationDB.collection('users').doc(currentUser.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            // Create user profile if doesn't exist
            await userRef.set({
                displayName: currentUser.displayName || currentUser.email.split('@')[0],
                email: currentUser.email,
                photoURL: currentUser.photoURL || '',
                friends: [],
                groups: [],
                friendRequests: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('User profile created');
        }
    } catch (error) {
        console.error('Error initializing user profile:', error);
    }
}

// ============================================
// FRIEND REQUEST SYSTEM
// ============================================

// Search for users by email
async function searchUserByEmail(email) {
    try {
        const usersRef = collaborationDB.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return { success: false, message: 'User not found' };
        }

        const userData = snapshot.docs[0].data();
        const userId = snapshot.docs[0].id;

        // Don't return current user
        if (userId === currentUser.uid) {
            return { success: false, message: 'Cannot add yourself' };
        }

        return {
            success: true,
            user: {
                id: userId,
                displayName: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL
            }
        };
    } catch (error) {
        console.error('Error searching user:', error);
        return { success: false, message: 'Search failed' };
    }
}

// Send friend request
async function sendFriendRequest(toUserId) {
    try {
        // Check if already friends
        const currentUserDoc = await collaborationDB.collection('users').doc(currentUser.uid).get();
        const friends = currentUserDoc.data().friends || [];

        if (friends.includes(toUserId)) {
            return { success: false, message: 'Already friends' };
        }

        // Check if request already exists
        const existingRequest = await collaborationDB.collection('friendRequests')
            .where('from', '==', currentUser.uid)
            .where('to', '==', toUserId)
            .where('status', '==', 'pending')
            .get();

        if (!existingRequest.empty) {
            return { success: false, message: 'Request already sent' };
        }

        // Create friend request
        await collaborationDB.collection('friendRequests').add({
            from: currentUser.uid,
            fromName: currentUser.displayName || currentUser.email,
            to: toUserId,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Add to recipient's friend requests array
        await collaborationDB.collection('users').doc(toUserId).update({
            friendRequests: firebase.firestore.FieldValue.arrayUnion({
                from: currentUser.uid,
                fromName: currentUser.displayName || currentUser.email,
                timestamp: new Date()
            })
        });

        return { success: true, message: 'Friend request sent!' };
    } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to send request' };
    }
}

// Load friend requests
async function loadFriendRequests() {
    try {
        const requestsSnapshot = await collaborationDB.collection('friendRequests')
            .where('to', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();

        const requests = [];
        requestsSnapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });

        displayFriendRequests(requests);
        return requests;
    } catch (error) {
        console.error('Error loading friend requests:', error);
        return [];
    }
}

// Accept friend request
async function acceptFriendRequest(requestId, fromUserId) {
    try {
        // Update request status
        await collaborationDB.collection('friendRequests').doc(requestId).update({
            status: 'accepted'
        });

        // Add to both users' friends arrays
        await collaborationDB.collection('users').doc(currentUser.uid).update({
            friends: firebase.firestore.FieldValue.arrayUnion(fromUserId)
        });

        await collaborationDB.collection('users').doc(fromUserId).update({
            friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });

        // Remove from friend requests array
        const userDoc = await collaborationDB.collection('users').doc(currentUser.uid).get();
        const friendRequests = userDoc.data().friendRequests || [];
        const updatedRequests = friendRequests.filter(req => req.from !== fromUserId);

        await collaborationDB.collection('users').doc(currentUser.uid).update({
            friendRequests: updatedRequests
        });

        // Reload friends and requests
        loadFriendRequests();
        loadFriends();

        return { success: true, message: 'Friend request accepted!' };
    } catch (error) {
        console.error('Error accepting friend request:', error);
        return { success: false, message: 'Failed to accept request' };
    }
}

// Reject friend request
async function rejectFriendRequest(requestId, fromUserId) {
    try {
        await collaborationDB.collection('friendRequests').doc(requestId).update({
            status: 'rejected'
        });

        // Remove from friend requests array
        const userDoc = await collaborationDB.collection('users').doc(currentUser.uid).get();
        const friendRequests = userDoc.data().friendRequests || [];
        const updatedRequests = friendRequests.filter(req => req.from !== fromUserId);

        await collaborationDB.collection('users').doc(currentUser.uid).update({
            friendRequests: updatedRequests
        });

        loadFriendRequests();
        return { success: true, message: 'Friend request rejected' };
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        return { success: false, message: 'Failed to reject request' };
    }
}

// Load friends list
async function loadFriends() {
    try {
        const userDoc = await collaborationDB.collection('users').doc(currentUser.uid).get();
        const friendIds = userDoc.data().friends || [];

        if (friendIds.length === 0) {
            displayFriends([]);
            return [];
        }

        const friends = [];
        for (const friendId of friendIds) {
            const friendDoc = await collaborationDB.collection('users').doc(friendId).get();
            if (friendDoc.exists) {
                friends.push({ id: friendId, ...friendDoc.data() });
            }
        }

        displayFriends(friends);
        return friends;
    } catch (error) {
        console.error('Error loading friends:', error);
        return [];
    }
}

// ============================================
// GROUP MANAGEMENT
// ============================================

// Create new group
async function createGroup(groupName, groupDescription) {
    try {
        const groupRef = await collaborationDB.collection('groups').add({
            name: groupName,
            description: groupDescription,
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: [currentUser.uid],
            invitations: [],
            sharedCalendar: [],
            progress: {
                totalTasks: 0,
                completedTasks: 0,
                weeklyGoal: 10
            }
        });

        // Add group to user's groups array
        await collaborationDB.collection('users').doc(currentUser.uid).update({
            groups: firebase.firestore.FieldValue.arrayUnion(groupRef.id)
        });

        loadGroups();
        return { success: true, message: 'Group created!', groupId: groupRef.id };
    } catch (error) {
        console.error('Error creating group:', error);
        return { success: false, message: 'Failed to create group' };
    }
}

// Load user's groups
async function loadGroups() {
    try {
        const userDoc = await collaborationDB.collection('users').doc(currentUser.uid).get();
        const groupIds = userDoc.data().groups || [];

        if (groupIds.length === 0) {
            displayGroups([]);
            return [];
        }

        const groups = [];
        for (const groupId of groupIds) {
            const groupDoc = await collaborationDB.collection('groups').doc(groupId).get();
            if (groupDoc.exists) {
                groups.push({ id: groupId, ...groupDoc.data() });
            }
        }

        displayGroups(groups);
        return groups;
    } catch (error) {
        console.error('Error loading groups:', error);
        return [];
    }
}

// Invite friend to group
async function inviteToGroup(groupId, friendId) {
    try {
        // Check if already a member
        const groupDoc = await collaborationDB.collection('groups').doc(groupId).get();
        const members = groupDoc.data().members || [];

        if (members.includes(friendId)) {
            return { success: false, message: 'Already a member' };
        }

        // Add invitation
        await collaborationDB.collection('groups').doc(groupId).update({
            invitations: firebase.firestore.FieldValue.arrayUnion({
                to: friendId,
                status: 'pending',
                timestamp: new Date()
            })
        });

        return { success: true, message: 'Invitation sent!' };
    } catch (error) {
        console.error('Error inviting to group:', error);
        return { success: false, message: 'Failed to send invitation' };
    }
}

// Accept group invitation
async function acceptGroupInvitation(groupId) {
    try {
        // Add user to group members
        await collaborationDB.collection('groups').doc(groupId).update({
            members: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });

        // Add group to user's groups
        await collaborationDB.collection('users').doc(currentUser.uid).update({
            groups: firebase.firestore.FieldValue.arrayUnion(groupId)
        });

        // Update invitation status
        const groupDoc = await collaborationDB.collection('groups').doc(groupId).get();
        const invitations = groupDoc.data().invitations || [];
        const updatedInvitations = invitations.map(inv => {
            if (inv.to === currentUser.uid) {
                return { ...inv, status: 'accepted' };
            }
            return inv;
        });

        await collaborationDB.collection('groups').doc(groupId).update({
            invitations: updatedInvitations
        });

        loadGroups();
        return { success: true, message: 'Joined group!' };
    } catch (error) {
        console.error('Error accepting group invitation:', error);
        return { success: false, message: 'Failed to join group' };
    }
}

// Load group invitations
async function loadGroupInvitations() {
    try {
        const allGroups = await collaborationDB.collection('groups').get();
        const invitations = [];

        allGroups.forEach(doc => {
            const groupData = doc.data();
            const groupInvitations = groupData.invitations || [];

            groupInvitations.forEach(inv => {
                if (inv.to === currentUser.uid && inv.status === 'pending') {
                    invitations.push({
                        groupId: doc.id,
                        groupName: groupData.name,
                        ...inv
                    });
                }
            });
        });

        displayGroupInvitations(invitations);
        return invitations;
    } catch (error) {
        console.error('Error loading group invitations:', error);
        return [];
    }
}

// ============================================
// SHARED CALENDAR
// ============================================

// Add event to group calendar
async function addGroupEvent(groupId, eventData) {
    try {
        const eventRef = await collaborationDB.collection('groupEvents').add({
            groupId: groupId,
            title: eventData.title,
            date: eventData.date,
            time: eventData.time,
            description: eventData.description,
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Add event ID to group's shared calendar
        await collaborationDB.collection('groups').doc(groupId).update({
            sharedCalendar: firebase.firestore.FieldValue.arrayUnion(eventRef.id)
        });

        return { success: true, message: 'Event added to group calendar!' };
    } catch (error) {
        console.error('Error adding group event:', error);
        return { success: false, message: 'Failed to add event' };
    }
}

// Load group calendar events
async function loadGroupCalendarEvents(groupId) {
    try {
        const eventsSnapshot = await collaborationDB.collection('groupEvents')
            .where('groupId', '==', groupId)
            .get();

        const events = [];
        eventsSnapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });

        return events;
    } catch (error) {
        console.error('Error loading group events:', error);
        return [];
    }
}

// ============================================
// GROUP PROGRESS
// ============================================

// Update group progress
async function updateGroupProgress(groupId, totalTasks, completedTasks) {
    try {
        await collaborationDB.collection('groups').doc(groupId).update({
            'progress.totalTasks': totalTasks,
            'progress.completedTasks': completedTasks
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating group progress:', error);
        return { success: false };
    }
}

// ============================================
// UI DISPLAY FUNCTIONS (to be implemented in HTML)
// ============================================

function displayFriendRequests(requests) {
    // This will be implemented in collab.html
    console.log('Friend Requests:', requests);
}

function displayFriends(friends) {
    // This will be implemented in collab.html
    console.log('Friends:', friends);
}

function displayGroups(groups) {
    // This will be implemented in collab.html
    console.log('Groups:', groups);
}

function displayGroupInvitations(invitations) {
    // This will be implemented in collab.html
    console.log('Group Invitations:', invitations);
}

console.log('📚 Collaboration Manager loaded');
