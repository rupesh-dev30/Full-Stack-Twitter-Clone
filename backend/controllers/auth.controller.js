export const signup = async (req, res) => {
  res.json({
    data: "You hit the signup endpoint",
  });
}

export const login = async (req, res) => {
  res.json({
    data: "You hit the signin endpoint",
  });
}

export const logout = async (req, res) => {
  res.json({
    data: "You hit the logout endpoint",
  });
}