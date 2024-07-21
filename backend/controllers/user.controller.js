import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.error(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: `Internal server error (getUserProfile) ${error.message}`,
    });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    if (!userToModify || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      //unfollow the user
      // currentUser.following = currentUser.following.filter((id) => id !== id);
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      //TODO return the id of the user as a response
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      //follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      //Send Notifaction
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });

      await newNotification.save();

      //TODO return the id of the user as a response
      res.status(200).json({ message: "User followed successfully" });

      //send notifcation
    }
  } catch (error) {
    res.status(500).json({
      message: `Internal server error (followUnfollowUser) ${error.message}`,
    });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, username, email, currentPassword, newPassword, bio, link } =
    req.body;

  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res
        .status(400)
        .json({ message: "Please enter both current and new password" });
    }

    if (currentPassword && newPassword) {
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (isPasswordCorrect) {
        if (newPassword.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters long" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
      } else {
        return res.status(400).json({ message: "Incorrect password" });
      }
    }

    if (profileImg) {
      if(user.profileImg) {
        await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    if (coverImg) {
      if(user.coverImg) {
        await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;
    user.bio = bio || user.bio;
    user.link = link || user.link;

    user = await user.save();
    user.password = null;
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: `error in update user:  ${error.message}` });
  }
};
