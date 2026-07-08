// ========== PETFY - CAROUSEL ==========
var Carousel = {
    init: function(containerId, options) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        var config = Object.assign({
            autoPlay: true,
            interval: 5000,
            dots: true,
            arrows: true
        }, options);
        
        var track = container.querySelector('.carousel-track');
        var slides = track.querySelectorAll('.carousel-slide');
        var dots = container.querySelectorAll('.dot');
        var prev = container.querySelector('.carousel-prev');
        var next = container.querySelector('.carousel-next');
        var currentSlide = 0;
        var totalSlides = slides.length;
        var interval;
        
        function goToSlide(index) {
            currentSlide = (index + totalSlides) % totalSlides;
            track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
            if (dots.length) {
                dots.forEach(function(d, i) { d.classList.toggle('active', i === currentSlide); });
            }
        }
        
        function nextSlide() { goToSlide(currentSlide + 1); }
        function prevSlide() { goToSlide(currentSlide - 1); }
        
        function startAutoPlay() {
            if (config.autoPlay) {
                stopAutoPlay();
                interval = setInterval(nextSlide, config.interval);
            }
        }
        
        function stopAutoPlay() { clearInterval(interval); }
        
        if (prev) prev.addEventListener('click', function() { prevSlide(); startAutoPlay(); });
        if (next) next.addEventListener('click', function() { nextSlide(); startAutoPlay(); });
        
        if (dots.length) {
            dots.forEach(function(dot, i) {
                dot.addEventListener('click', function() { goToSlide(i); startAutoPlay(); });
            });
        }
        
        container.addEventListener('mouseenter', stopAutoPlay);
        container.addEventListener('mouseleave', startAutoPlay);
        
        startAutoPlay();
    }
};

console.log('✅ Carousel cargado');