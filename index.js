// In-memory storage for reviews (per session)
const reviews = [];

// Cached DOM elements
const reviewForm = document.getElementById('reviewForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const descCount = document.getElementById('descCount');
const reviewsList = document.getElementById('reviewsList');
const totalReviewsEl = document.getElementById('totalReviews');
const avgRatingEl = document.getElementById('avgRating');
const recPercentEl = document.getElementById('recPercent');
const errName = document.getElementById('errName');
const errEmail = document.getElementById('errEmail');
const errTitle = document.getElementById('errTitle');
const errDescription = document.getElementById('errDescription');
const errRating = document.getElementById('errRating');
const sortSelect = document.getElementById('sortSelect');
const starInputs = document.querySelectorAll('.stars input[name="rating"]');

// Utilities
function isValidLength(str, min, max){
	if (typeof str !== 'string') return false;
	const len = str.trim().length;
	return len >= min && len <= max;
}

function isValidEmail(email){
	if (!email) return true; // optional
	// Simple email check
	return /^\S+@\S+\.\S+$/.test(email);
}

function getSelectedRating(){
	const el = document.querySelector('input[name="rating"]:checked');
	return el ? Number(el.value) : null;
}

function getRecommend(){
	const el = document.querySelector('input[name="recommend"]:checked');
	return el ? el.value : null;
}

function clearErrors(){
	[errName, errEmail, errTitle, errDescription, errRating].forEach(e => e.textContent = '');
}

function formatDateTime(d){
	try { return new Date(d).toLocaleString(); } catch(e){ return String(d); }
}

// Calculations and rendering
function renderStats(){
	const total = reviews.length;
	const avg = total ? (reviews.reduce((s,r)=>s+r.rating,0)/total) : 0;
	const recCount = reviews.filter(r => r.recommend === 'yes').length;
	const recPercent = total ? Math.round((recCount/total)*100) : 0;

	totalReviewsEl.textContent = total;
	avgRatingEl.textContent = avg ? avg.toFixed(1) : '0.0';
	recPercentEl.textContent = `${recPercent}%`;
}

function createStarSpan(rating){
	const span = document.createElement('span');
	span.className = 'review-rating';
	// show stars
	span.textContent = '★'.repeat(rating) + '☆'.repeat(5-rating);
	return span;
}

function renderReviews(){
	reviewsList.innerHTML = '';
	const sort = sortSelect.value;
	const copy = reviews.slice();
	if (sort === 'newest') copy.sort((a,b)=>b.date - a.date);
	else if (sort === 'highest') copy.sort((a,b)=>b.rating - a.rating || b.date - a.date);

	if (copy.length === 0){
		const p = document.createElement('p');
		p.textContent = 'No reviews yet. Be the first to review!';
		reviewsList.appendChild(p);
		return;
	}

	copy.forEach((r, idx) => {
		const card = document.createElement('article');
		card.className = 'review-card';

		const meta = document.createElement('div');
		meta.className = 'review-meta';
		const left = document.createElement('div');
		left.innerHTML = `<div class="review-author">${escapeHtml(r.name || 'Anonymous')}</div><div class="review-date">${formatDateTime(r.date)}</div>`;
		const right = document.createElement('div');
		right.appendChild(createStarSpan(r.rating));
		meta.appendChild(left);
		meta.appendChild(right);

		const title = document.createElement('h4');
		title.className = 'review-title';
		title.textContent = r.title;

		const body = document.createElement('div');
		body.className = 'review-body';
		body.textContent = r.description;

		const rec = document.createElement('div');
		rec.className = 'review-recommend';
		rec.textContent = r.recommend === 'yes' ? 'Would recommend' : (r.recommend === 'no' ? 'Would not recommend' : 'No recommendation');

		const helpful = document.createElement('div');
		helpful.className = 'helpful';
		const helpBtn = document.createElement('button');
		helpBtn.type = 'button';
		helpBtn.textContent = `Helpful (${r.helpful || 0})`;
		helpBtn.addEventListener('click', ()=>{
			r.helpful = (r.helpful || 0) + 1;
			helpBtn.textContent = `Helpful (${r.helpful})`;
		});
		helpful.appendChild(helpBtn);

		card.appendChild(meta);
		card.appendChild(title);
		card.appendChild(body);
		card.appendChild(rec);
		card.appendChild(helpful);

		reviewsList.appendChild(card);
	});
}

// simple escape to avoid injection when inserting user text into innerHTML
function escapeHtml(str){
	return String(str)
		.replace(/&/g,'&amp;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;')
		.replace(/"/g,'&quot;')
		.replace(/'/g,'&#39;');
}

// Validation
function validateForm(){
	clearErrors();
	let valid = true;

	const name = nameInput.value || '';
	if (!isValidLength(name,2,30)){
		errName.textContent = 'Name should be between 2 and 30 characters';
		valid = false;
	}

	const email = emailInput.value || '';
	if (!isValidEmail(email)){
		errEmail.textContent = 'Please enter a valid email address';
		valid = false;
	}

	const title = titleInput.value || '';
	if (!isValidLength(title,5,100)){
		errTitle.textContent = 'Review title should be between 5 and 100 characters';
		valid = false;
	}

	const desc = descInput.value || '';
	if (!isValidLength(desc,20,1000)){
		errDescription.textContent = 'Review description should be between 20 and 1000 characters';
		valid = false;
	}

	const rating = getSelectedRating();
	if (!rating || rating < 1 || rating > 5){
		errRating.textContent = 'Please select a product rating';
		valid = false;
	}

	return valid;
}

// Submit handler
reviewForm.addEventListener('submit', (e)=>{
	e.preventDefault();
	if (!validateForm()) return;

	const review = {
		name: nameInput.value.trim(),
		email: emailInput.value.trim() || null,
		title: titleInput.value.trim(),
		description: descInput.value.trim(),
		rating: getSelectedRating(),
		recommend: getRecommend(),
		date: Date.now(),
		helpful: 0
	};

	reviews.push(review);
	renderStats();
	renderReviews();
	reviewForm.reset();
	descCount.textContent = '0';
	// move focus back to name for quick multiple submissions
	nameInput.focus();
});

// Character counter
descInput.addEventListener('input', ()=>{
	const len = descInput.value.length;
	descCount.textContent = String(len);
});

// When a star is selected, update a small accessible text showing numeric rating
function updateSelectedRatingLabel(){
	let label = document.getElementById('selectedRating');
	if (!label){
		label = document.createElement('div');
		label.id = 'selectedRating';
		label.style.fontSize = '0.95rem';
		label.style.marginTop = '6px';
		const starsEl = document.getElementById('starRating');
		starsEl.parentNode.insertBefore(label, starsEl.nextSibling);
	}
	const rating = getSelectedRating();
	label.textContent = rating ? `Selected rating: ${rating} star${rating>1?'s':''}` : '';
}

starInputs.forEach(i=>i.addEventListener('change', updateSelectedRatingLabel));

// Sort change listener
sortSelect.addEventListener('change', ()=>{
	renderReviews();
});

// Initial render
renderStats();
renderReviews();

