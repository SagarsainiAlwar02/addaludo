import Sidebar from "../../components/Sidebar/Sidebar"
import "./Layout.css"

const Layout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;