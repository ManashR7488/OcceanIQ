export const signup = (req, res) => {};


export const login = (req, res) => {};


export const logout = (req, res) => {};




export const getProfile = (req, res) => {
  const user = req.user; // Assuming user information is stored in req.user
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ user });
};
