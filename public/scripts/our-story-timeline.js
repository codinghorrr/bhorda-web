(function () {
	'use strict';

	function initStoryTimeline(root) {
		var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			root.classList.add('story-scroll-timeline--reduced');
			root.querySelectorAll('.story-scroll-timeline__item').forEach(function (item) {
				item.classList.add('is-visible');
			});
			var fill = root.querySelector('.story-scroll-timeline__spine-fill');
			if (fill) fill.style.height = '100%';
			return;
		}

		var badge = root.querySelector('[data-story-year-badge]');
		var spineFill = root.querySelector('.story-scroll-timeline__spine-fill');
		var items = Array.prototype.slice.call(root.querySelectorAll('.story-scroll-timeline__item'));

		if (!items.length) return;

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						var year = entry.target.getAttribute('data-story-year-label') || entry.target.getAttribute('data-story-year');
						if (badge && year) {
							badge.textContent = year;
							badge.classList.add('is-pulse');
							window.setTimeout(function () {
								badge.classList.remove('is-pulse');
							}, 600);
						}
					}
				});
			},
			{ root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.2 },
		);

		items.forEach(function (item) {
			observer.observe(item);
		});

		function updateSpine() {
			if (!spineFill) return;
			var track = root.querySelector('.story-scroll-timeline__track');
			if (!track) return;
			var rect = track.getBoundingClientRect();
			var viewport = window.innerHeight || document.documentElement.clientHeight;
			var start = rect.top;
			var end = rect.bottom - viewport * 0.35;
			var progress = 0;
			if (end > start) {
				progress = (viewport * 0.65 - start) / (end - start);
			}
			progress = Math.max(0, Math.min(1, progress));
			spineFill.style.height = progress * 100 + '%';
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
