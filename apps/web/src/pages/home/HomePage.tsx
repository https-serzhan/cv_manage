import { Link } from "react-router-dom";

import { useCurrentUser } from "../../entities/user/model/use-current-user";
import { routes } from "../../shared/routes/paths";

type HomeCard = {
  title: string;
  description: string;
  to: string;
  action: string;
};

export default function HomePage() {
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data?.authenticated ? currentUserQuery.data.user : null;
  const roleCodes = currentUser?.roles.map((role) => role.code) ?? [];
  const isCandidate = roleCodes.includes("CANDIDATE");
  const isRecruiter = roleCodes.includes("RECRUITER");
  const isAdmin = roleCodes.includes("ADMIN");
  const canUseProfile = isCandidate || isAdmin;
  const canManageAttributes = isRecruiter || isAdmin;
  const canPreviewCv = isCandidate || isAdmin;
  const cards: HomeCard[] = [];

  if (canUseProfile) {
    cards.push({
      title: "Candidate Profile",
      description: "Maintain profile details, dynamic attributes, projects, and project tags.",
      to: routes.profile,
      action: "Open profile"
    });
  }

  if (canManageAttributes) {
    cards.push({
      title: "Attribute Library",
      description: "Manage reusable profile attributes used by positions and CV previews.",
      to: routes.attributes,
      action: "Manage attributes"
    });
  }

  cards.push({
    title: "Positions",
    description: "Browse available positions or manage position templates based on your role.",
    to: routes.positions,
    action: "Open positions"
  });

  if (canPreviewCv) {
    cards.push({
      title: "CV Preview Flow",
      description: "Select a position first, then preview a backend-computed candidate CV.",
      to: routes.positions,
      action: "Choose position"
    });
  }

  if (isAdmin) {
    cards.push({
      title: "Admin Users",
      description: "Review platform users and adjust roles without exposing provider accounts.",
      to: routes.adminUsers,
      action: "Manage users"
    });
  }

  return (
    <section className="home-page">
      <div className="app-page-header">
        <div>
          <h1>CV Management Platform</h1>
          <p>Manage the profile, attributes, positions, and CV preview flow from one workspace.</p>
        </div>
      </div>

      <div className="home-dashboard">
        {cards.map((card) => (
          <Link className="home-dashboard__card" to={card.to} key={card.title}>
            <span className="home-dashboard__label">{card.title}</span>
            <span>{card.description}</span>
            <strong>{card.action}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
