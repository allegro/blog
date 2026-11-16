(() => {
    const postContent = document.querySelector('#post-content');

    if (!postContent) {
        return;
    }

    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.hidden = true;
    lightbox.tabIndex = -1;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image preview');

    const content = document.createElement('div');
    content.className = 'image-lightbox__content';

    const image = document.createElement('img');
    image.className = 'image-lightbox__image';

    const caption = document.createElement('div');
    caption.className = 'image-lightbox__caption';

    const closeButton = document.createElement('button');
    closeButton.className = 'image-lightbox__close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close image preview');

    content.append(image, caption);
    lightbox.append(content, closeButton);
    document.body.append(lightbox);

    let previouslyFocusedElement;
    let previousTabIndex;

    function closeLightbox() {
        if (lightbox.hidden) {
            return;
        }

        lightbox.hidden = true;
        document.body.classList.remove('image-lightbox-open');
        image.removeAttribute('src');

        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();

            if (previousTabIndex === null) {
                previouslyFocusedElement.removeAttribute('tabindex');
            } else {
                previouslyFocusedElement.setAttribute('tabindex', previousTabIndex);
            }
        }
    }

    postContent.addEventListener('click', (event) => {
        const clickedImage = event.target.closest('img');

        if (
            !clickedImage ||
            !postContent.contains(clickedImage) ||
            !clickedImage.currentSrc
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        previouslyFocusedElement = clickedImage;
        previousTabIndex = clickedImage.getAttribute('tabindex');
        clickedImage.setAttribute('tabindex', '-1');
        image.src = clickedImage.currentSrc;
        image.alt = clickedImage.alt;

        const figureCaption = clickedImage.closest('figure')?.querySelector('figcaption');
        caption.textContent = figureCaption?.textContent.trim() || clickedImage.alt;

        lightbox.hidden = false;
        document.body.classList.add('image-lightbox-open');
        lightbox.focus();
    });

    closeButton.addEventListener('click', closeLightbox);
    image.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (event) => {
        if (!image.contains(event.target) && !closeButton.contains(event.target)) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (lightbox.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            closeButton.focus();
        }
    });
})();
