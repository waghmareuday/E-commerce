const mongoose = require("mongoose");
const ProductModel = require("../Models/ProductModel");
const DiscountModel = require("../Models/DiscountModel");
const SellerModel = require("../Models/SellerModel");
const CategoryModel = require("../Models/CategoryModel");
const ReviewModel = require("../Models/ReviewModel");
const LikeModel = require("../Models/LikeModel");
const UserModel = require("../Models/UserModel");

const getAllLikesByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const likes = await LikeModel.find({ user: userId }).populate("product");
    if (likes && likes.length > 0) {
      res.send({
        success: true,
        message: "Likes fetched",
        likes,
      });
    } else {
      res.send({
        success: false,
        message: "Likes Not Found ",
      });
    }
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const getAllReviewsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const review = await ReviewModel.find({ user: userId }).populate("product");
    if (review && review.length > 0) {
      res.send({
        success: true,
        message: "Reviews fetched",
        review,
      });
    } else {
      res.send({
        success: false,
        message: "Reviews Not Found ",
      });
    }
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const user = await UserModel.findById({ _id: userId });

    if (user) {
      // Check if the product is already in the cart
      const isProductInCart = user.cart.some(
        (cartItem) => cartItem.product.toString() === productId
      );

      if (isProductInCart) {
        return res.send({
          success: true,
          message: "Product Already Added to the cart",
          user,
        });
      } else {
        user.cart.push({
          product: productId,
          quantity: quantity || 1,
        });
        await user.save();
        return res.send({
          success: true,
          message: "Product added to cart",
          user,
        });
      }
    } else {
      return res.send({
        success: false,
        message: "User Not Exist",
      });
    }
  } catch (err) {
    return res.send({
      success: false,
      message: err.message,
    });
  }
};

const addReview = async (req, res) => {
  try {
    let { userId, productId, rating, title, desc } = req.body;
    if (rating <= 0) {
      rating = 1;
    } else if (rating > 5) {
      rating = 5;
    }
    const review = new ReviewModel({
      user: userId,
      product: productId,
      rating: rating,
      title: title,
      desc: desc,
    });
    await review.save();

    const getUser = await UserModel.findById(userId);
    if (!getUser) {
      return res.send({
        success: false,
        message: "Seller Not Found.",
      });
    }

    getUser.reviews.push(review._id);
    await getUser.save();

    const getProduct = await ProductModel.findById(productId);
    if (!getProduct) {
      return res.send({
        success: false,
        message: "Product Not Found.",
      });
    }

    let avgRating = getProduct.ratings + rating;
    let totalReviews = getProduct.reviews.length + 1;
    avgRating = (avgRating / totalReviews).toFixed(1);

    getProduct.numReviews = totalReviews;
    getProduct.ratings = avgRating;
    getProduct.reviews.push(review._id);

    await getProduct.save();

    return res.send({
      success: true,
      message: "Review Uploaded Successfully.",
      review,
      getProduct,
      getUser,
    });
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const likeDisLikeTheProduct = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Check if the like already exists
    const existingLike = await LikeModel.findOne({
      user: userId,
      product: productId,
    });

    if (existingLike) {
      // If like exists, remove it (dislike)
      await LikeModel.findByIdAndDelete(existingLike._id);

      const getProduct = await ProductModel.findById(productId);
      if (!getProduct) {
        return res.send({
          success: false,
          message: "Product Not Found.",
        });
      }

      getProduct.likes.pull(existingLike._id);
      await getProduct.save();

      const getUser = await UserModel.findById(userId);
      if (!getUser) {
        return res.send({
          success: false,
          message: "User Not Found.",
        });
      }

      getUser.likes.pull(existingLike._id);
      await getUser.save();

      return res.send({
        success: true,
        message: "Product Disliked Successfully.",
        getProduct,
        getUser,
      });
    } else {
      // If like does not exist, create a new like
      const like = new LikeModel({
        user: userId,
        product: productId,
      });
      await like.save();

      const getProduct = await ProductModel.findById(productId);
      if (!getProduct) {
        return res.send({
          success: false,
          message: "Product Not Found.",
        });
      }

      getProduct.likes.push(like._id);
      await getProduct.save();

      const getUser = await UserModel.findById(userId);
      if (!getUser) {
        return res.send({
          success: false,
          message: "User Not Found.",
        });
      }

      getUser.likes.push(like._id);
      await getUser.save();

      return res.send({
        success: true,
        message: "Product Liked Successfully.",
        like,
        getProduct,
        getUser,
      });
    }
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { address, city, pinCode, state } = req.body;
    const user = await UserModel.findById(userId);
    if (user) {
      user.shippingAddress.address = address;
      user.shippingAddress.city = city;
      user.shippingAddress.pinCode = pinCode;
      user.shippingAddress.state = state;

      await user.save();
      return res.send({
        success: true,
        message: "Address Updated Successfully",
        user,
      });
    } else {
      return res.send({
        success: false,
        message: "User Not Found",
      });
    }
  } catch (err) {
    return res.send({
      success: false,
      message: err.message,
    });
  }
};

const updatePersonalInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name } = req.body;
    const user = await UserModel.findById(userId);
    if (user) {
      user.name = name;

      await user.save();
      return res.send({
        success: true,
        message: "Address Updated Successfully",
        user,
      });
    } else {
      return res.send({
        success: false,
        message: "User Not Found",
      });
    }
  } catch (err) {
    return res.send({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllLikesByUser,
  getAllReviewsByUser,
  addToCart,
  addReview,
  likeDisLikeTheProduct,
  editAddress,
  updatePersonalInfo
};