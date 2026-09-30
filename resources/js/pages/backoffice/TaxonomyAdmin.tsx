import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { groupProducts, type CatalogGroup } from '../../lib/catalog';
import { api } from '../../services/api';
import { useData, ErrorBox, Loading } from '../../ui';

function GroupTable({
  title,
  groups,
  all,
  param,
}: {
  title: string;
  groups: CatalogGroup[];
  all: string[];
  param: 'categoria' | 'marca';
}) {
  const counts = new Map(groups.map((group) => [group.name, group.count]));
  const names = [...new Set([...groups.map((group) => group.name), ...all])];
  return (
    <section className="bo-card" aria-labelledby={`${param}-title`}>
      <h2 id={`${param}-title`}>{title}</h2>
      {names.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col" className="num">
                  Productos publicados
                </th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {names.map((name) => (
                <tr key={name}>
                  <td>
                    <strong>{name}</strong>
                  </td>
                  <td className="num">{counts.get(name) ?? 0}</td>
                  <td className="num">
                    <Link
                      className="link-button"
                      to={`/catalogo?${param}=${encodeURIComponent(name)}`}
                    >
                      Ver en tienda
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Sin registros.</p>
      )}
    </section>
  );
}

export function TaxonomyAdmin() {
  const products = useData(api.products);
  const categories = useData(api.categories);
  const brands = useData(api.brands);
  const loading = products.loading || categories.loading || brands.loading;
  const error = products.error || categories.error || brands.error;
  const retry = () => {
    products.reload();
    categories.reload();
    brands.reload();
  };
  return (
    <>
      <PageHeader
        title="Categorías y marcas"
        description="Se crean automáticamente al guardar un producto con un nombre nuevo. El backend aún no permite editarlas ni eliminarlas."
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={retry} />
      ) : (
        <div className="bo-two-columns">
          <GroupTable
            title="Categorías"
            param="categoria"
            groups={groupProducts(products.data ?? [], 'category')}
            all={categories.data ?? []}
          />
          <GroupTable
            title="Marcas"
            param="marca"
            groups={groupProducts(products.data ?? [], 'brand')}
            all={brands.data ?? []}
          />
        </div>
      )}
    </>
  );
}
