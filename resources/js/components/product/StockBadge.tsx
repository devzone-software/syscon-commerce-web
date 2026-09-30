export function StockBadge({ stock, showUnits = false }: { stock: number; showUnits?: boolean }) {
  const available = stock > 0;
  return (
    <span className={`stock-badge${available ? '' : ' out'}`}>
      {available
        ? showUnits
          ? `Disponible · ${stock} ${stock === 1 ? 'unidad' : 'unidades'}`
          : 'Disponible'
        : 'Sin stock'}
    </span>
  );
}
