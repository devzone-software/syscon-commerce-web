export function ProductGalleryThumbs({
  photos,
  selected,
  onSelect,
}: {
  photos: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  if (photos.length < 2) return null;

  return (
    <div className="product-gallery-thumbs" role="group" aria-label="Fotos del producto">
      {photos.map((photo, index) => (
        <button
          key={photo}
          type="button"
          aria-pressed={selected === index}
          aria-label={`Ver foto ${index + 1} de ${photos.length}`}
          onClick={() => onSelect(index)}
        >
          <img src={photo} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}
