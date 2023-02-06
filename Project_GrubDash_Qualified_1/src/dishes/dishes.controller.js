const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

const list = (req, res) => {
  res.json({ data: dishes });
};

const findDish = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    res.locals.id = dishId;
    next();
  } else {
    next({
      status: 404,
      message: `dish ${dishId} not found`,
    });
  }
};

const read = (req, res) => {
  res.json({ data: res.locals.dish });
};

const create = (req, res, next) => {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

const bodyDataHas = (propertyName) => {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName] !== "") {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
};

const checkPrice = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && Number(price) > 0) {
    return next();
  } else {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
};

const checkId = (req, res, next) => {
  const dishId = res.locals.id;
  const {
    data: { id },
  } = req.body;
  if (id && dishId !== id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  return next();
};

const update = (req, res, next) => {
  const dish = res.locals.dish;
  const {
    data: { name, description, price, image_url },
  } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
};

const checkDishStatus = (req, res, next) => {
  const dish = res.locals.dish;

  if (dish.status == "pending") {
    return next();
  } else {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }
};

const destroy = (req, res, next) => {
  const { dishId } = req.params;
  index = dishes.indexOf((dish) => dish.id === Number(dishId));
  dishes.splice(index, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  read: [findDish, read],
  update: [
    findDish,
    checkId,
    bodyDataHas("name"),
    bodyDataHas("price"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    checkPrice,
    update,
  ],
  create: [
    bodyDataHas("name"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    bodyDataHas("description"),
    checkPrice,
    create,
  ],
  destroy: [findDish, checkDishStatus, destroy],
};
