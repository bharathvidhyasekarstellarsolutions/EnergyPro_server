const jwt = require("jsonwebtoken");

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "" });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("allowedRoles ::", allowedRoles);
      // console.log("Decoded Token From RoleMiddleware ::", decodedToken);

      const { id, username, email, role } = {...decodedToken};
      req.user = {...decodedToken};

      // Get userId either from the body or from params
      const userIdFromBody = req.body?.userId;
      const userIdFromParams = req.params?.id;

      if (!role) {
        return res.status(403).json({ message: "Forbidden: No role found" });
      }

      if (
        (allowedRoles.includes("self") &&
          (req.user.id === userIdFromBody ||
            req.user.id === userIdFromParams)) ||
        allowedRoles.includes(role)
      ) {
        return next();
      }

      return res.status(403).json({ message: "Forbidden: Access denied" });
    } catch (error) {
      // Handle invalid or expired token
      console.log("Token verification failed:", error);
      return res
        .status(401)
        .json({ message: "Invalid token", error: error.message });
    }
  };
};

module.exports = roleMiddleware;
