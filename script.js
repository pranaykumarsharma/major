const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const profileContainer = document.getElementById('profile-container');
const reposContainer = document.getElementById('repos-container');
const errorMsg = document.getElementById('error-msg');
const loader = document.getElementById('loader');

// Profile Elements
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userLogin = document.getElementById('user-login');
const userBio = document.getElementById('user-bio');
const userLocation = document.getElementById('user-location');
const userCompany = document.getElementById('user-company');
const userBlog = document.getElementById('user-blog');

// Stats Elements
const userPublicRepos = document.getElementById('user-public-repos');
const userFollowers = document.getElementById('user-followers');
const userFollowing = document.getElementById('user-following');

const API_URL = 'https://api.github.com/users/';

// --- Event Listeners ---
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// --- Main Search Function ---
async function handleSearch() {
    const username = searchInput.value.trim();

    // Reset UI
    errorMsg.classList.add('hidden');
    profileContainer.classList.add('hidden');
    reposContainer.innerHTML = '';
    
    if (!username) {
        showError('Please enter a GitHub username.');
        return;
    }

    loader.classList.remove('hidden');

    try {
        // Parallel fetching for speed
        const [userResponse, reposResponse] = await Promise.all([
            fetch(`${API_URL}${username}`),
            fetch(`${API_URL}${username}/repos?sort=updated&per_page=10`)
        ]);
        
        if (!userResponse.ok) {
            throw new Error(userResponse.status === 404 ? 'User not found' : 'Error fetching data');
        }

        const userData = await userResponse.json();
        const reposData = await reposResponse.json();

        displayProfile(userData);
        displayRepos(reposData);

    } catch (error) {
        showError(error.message);
    } finally {
        loader.classList.add('hidden');
    }
}

// --- Display Profile ---
function displayProfile(user) {
    userAvatar.src = user.avatar_url;
    userName.textContent = user.name || user.login;
    userLogin.textContent = `@${user.login}`;
    userLogin.href = user.html_url;
    userBio.textContent = user.bio || 'This user has no bio.';

    // Stats
    userPublicRepos.textContent = user.public_repos;
    userFollowers.textContent = user.followers;
    userFollowing.textContent = user.following;

    // Optional Details with Helpers
    checkAndDisplay(userLocation, user.location);
    checkAndDisplay(userCompany, user.company);

    if (user.blog) {
        userBlog.classList.remove('hidden');
        const link = userBlog.querySelector('a');
        let rawLink = user.blog;
        // Ensure link has protocol
        if (!rawLink.startsWith('http')) {
            rawLink = `https://${rawLink}`;
        }
        link.href = rawLink;
        link.textContent = 'Website/Blog';
    } else {
        userBlog.classList.add('hidden');
    }

    profileContainer.classList.remove('hidden');
}

// --- Helper to toggle hidden elements ---
function checkAndDisplay(element, value) {
    if (value) {
        element.classList.remove('hidden');
        element.querySelector('span').textContent = value;
    } else {
        element.classList.add('hidden');
    }
}

// --- Display Repositories ---
function displayRepos(repos) {
    if (repos.length === 0) {
        reposContainer.innerHTML = '<p class="text-gray-400 col-span-1 md:col-span-2 text-center py-10">No public repositories found.</p>';
        return;
    }

    repos.forEach(repo => {
        const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const repoCard = document.createElement('div');
        repoCard.className = 'glass-panel p-5 md:p-6 rounded-xl repo-card flex flex-col h-full border border-gray-700 group';
        
        repoCard.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1 min-w-0 pr-4">
                    <h4 class="text-lg md:text-xl font-bold text-blue-400 truncate group-hover:text-white transition-colors">
                        <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    </h4>
                </div>
                <div class="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-xs md:text-sm border border-gray-600 shrink-0">
                    <i class="fas fa-star text-yellow-400 text-xs"></i> 
                    <span class="font-mono text-white">${repo.stargazers_count}</span>
                </div>
            </div>

            <p class="text-gray-400 text-xs md:text-sm mb-4 flex-1 line-clamp-2">
                ${repo.description || 'No description provided.'}
            </p>

            <div class="border-t border-gray-700 pt-4 mt-auto flex justify-between items-center text-xs text-gray-400">
                <div class="flex items-center gap-3 md:gap-4">
                    ${repo.language ? `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> ${repo.language}</span>` : ''}
                    <span class="hidden sm:inline"><i class="far fa-clock"></i> ${updatedDate}</span>
                </div>
                
                <a href="${repo.html_url}" target="_blank" class="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-1" title="View Code">
                    View <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
        
        reposContainer.appendChild(repoCard);
    });
}

// --- Error Handling ---
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    searchInput.classList.add('border-red-500', 'animate-pulse');
    setTimeout(() => searchInput.classList.remove('border-red-500', 'animate-pulse'), 1000);
}