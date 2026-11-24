import { Link } from 'react-router-dom';
import { can, permissions, roleLabel } from '../../lib/auth';
import { useShop } from '../../state';
import { PageHeader } from './PageHeader';

type Task = { path: string; label: string; group: string; description: string };

/** Describes only the sections already authorized by the backoffice route registry. */
export function AccessOverview({ sections }: { sections: Task[] }) {
  const { user } = useShop();
  const tasks = sections.filter((section) => section.path);
  const groups = [...new Set(tasks.map((task) => task.group))];
  return (
    <>
      <PageHeader
        title="Mi acceso"
        description="Consulta las tareas habilitadas para tu cuenta y entra al área que necesitas."
      />
      <section className="bo-card" aria-labelledby="access-account-title">
        <h2 id="access-account-title">Tu cuenta de trabajo</h2>
        <p>{user?.roles.map(roleLabel).join(' / ')}</p>
        <p className="muted">
          Tus accesos indican qué puedes hacer en el sistema. Si necesitas otra tarea para tu
          trabajo, solicítala a la administración de SYSCON.
        </p>
        {can(user, permissions.cashManage) && !can(user, permissions.salesCreate) && (
          <p className="notice" role="note">
            Puedes gestionar caja. La venta en mostrador no está habilitada para tu cuenta; consulta
            a administración si forma parte de tus tareas.
          </p>
        )}
      </section>
      <div className="access-areas">
        {groups.map((group) => (
          <section className="bo-card" key={group} aria-labelledby={`access-${group}`}>
            <h2 id={`access-${group}`}>{group}</h2>
            <ul className="access-task-list">
              {tasks
                .filter((task) => task.group === group)
                .map((task) => (
                  <li key={task.path}>
                    <Link to={`/admin/${task.path}`}>
                      <strong>{task.label}</strong>
                      <span>{task.description}</span>
                      <span className="access-task-action">
                        Abrir {task.label.toLocaleLowerCase('es-PE')} →
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
