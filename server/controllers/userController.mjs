import User from "../models/userModel.mjs";  // ✅ default import


// GET PROFILE
export const getUserProfile = async (req, res) => {
  res.status(200).json(req.user);
};


// UPDATE PROFILE
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.username = req.body.username ?? user.username;
  user.email = req.body.email ?? user.email;
  user.profilePicture = req.body.profilePicture ?? user.profilePicture;
  user.weight = req.body.weight ?? user.weight;
  user.height = req.body.height ?? user.height;
  user.age = req.body.age ?? user.age;
  user.goal = req.body.goal ?? user.goal;

  const updatedUser = await user.save();

  res.status(200).json(updatedUser);
};
