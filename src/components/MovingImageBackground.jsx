
const images = [
  "/images/image-1.png",
  "/images/image-2.png",
  "/images/image-3.png",
  "/images/image-4.png",
  "/images/image-5.png",
];

function MovingImageBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="flex h-full w-max animate-slide-images">
        {[...images, ...images].map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="h-full w-screen shrink-0"
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              draggable="false"
              className="h-full w-full select-none object-cover"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}

export default MovingImageBackground;
