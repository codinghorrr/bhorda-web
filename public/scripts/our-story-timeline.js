(function () {
	'use strict';

	function initStoryTimeline(root) {
		var spineFill = root.querySelector('.story-scroll-timeline__spine-fill');
		var progressLabel = root.querySelector('[data-story-progress-label]');
		var items = Array.prototype.slice.call(root.querySelectorAll('.story-scroll-timeline__item'));
		var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!items.length) return;

		if (reduced) {
			root.classList.add('story-scroll-timeline--reduced');
			items.forEach(function (item) {
				item.classList.add('is-visible');
			});
			if (spineFill) spineFill.style.height = '100%';
			return;
		}

		var hideTimer;

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
					}
				});
			},
			{ threshold: 0.25 },
		);

		items.forEach(function (item) {
			observer.observe(item);
		});

		function updateSpine() {
			if (!spineFill) return;
			var rect = root.getBoundingClientRect();
			var viewportH = window.innerHeight || document.documentElement.clientHeight;
			var total = rect.height;
			var scrolled = Math.min(Math.max(viewportH * 0.6 - rect.top, 0), total);
			var pct = total > 0 ? (scrolled / total) * 100 : 0;
			spineFill.style.height = pct + '%';

			if (!progressLabel) return;

			var currentYear = '';
			items.forEach(function (item) {
				var r = item.getBoundingClientRect();
				if (r.top < viewportH * 0.6) {
					currentYear = item.getAttribute('data-story-year-label') || item.getAttribute('data-story-year') || '';
				}
			});

			if (currentYear) {
				progressLabel.textContent = currentYear;
				progressLabel.classList.add('is-show');
				window.clearTimeout(hideTimer);
				hideTimer = window.setTimeout(function () {
					progressLabel.classList.remove('is-show');
				}, 900);
			}
		}

		updateSpine();
		window.addEventListener('scroll', updateSpine, { passive: true });
		window.addEventListener('resize', updateSpine, { passive: true });
		root.classList.add('story-scroll-timeline--ready');
	}

	document.querySelectorAll('[data-story-timeline]').forEach(function (root) {
		initStoryTimeline(root);
	});
})();
