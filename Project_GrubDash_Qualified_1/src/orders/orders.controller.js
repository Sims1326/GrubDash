const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const list = (req, res, next) => {
  res.json({ data: orders });
};

const findOrders = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  } else {
    next({
      status: 404,
      message: `Order ${orderId} not found`,
    });
  }
};

const read = (req, res) => {
  res.json({ data: res.locals.order });
};

const create = (req, res, next) => {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

const bodyDataHas = (propertyName) => {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName] !== "") {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
};

const checkDishes = (req, res, next) => {
  const {
    data: { dishes },
  } = req.body;
  if (!Array.isArray(dishes) || !dishes.length > 0) {
    return next({
      status: 400,
      message: "Orders must include at least one dish",
    });
  }
  for (let dish in dishes) {
    if (!dishes[dish].quantity || !Number.isInteger(dishes[dish].quantity)) {
      return next({
        status: 400,
        message: `${dishes[dish].quantity} Dish ${dish} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
};

const checkId = (req, res, next) => {
  const { orderId } = req.params;
  const {
    data: { id },
  } = req.body;
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
};

const update = (req, res, next) => {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;

  res.json({ data: order });
};

const isPending = (req, res, next) => {
  const order = res.locals.order;

  if (order.status == "pending") {
    return next();
  } else {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }
};

const checkStatus = (req, res, next) => {
  const {
    data: { status },
  } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status) && status !== "delivered") {
    return next();
  }
  next({
    status: 400,
    message: `A delivered order cannot be changed. status:${status}`,
  });
};

const destroy = (req, res, next) => {
  const { orderId } = req.params;
  index = orders.indexOf((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  read: [findOrders, read],
  update: [
    findOrders,
    bodyDataHas("status"),
    checkStatus,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    checkDishes,
    checkId,
    update,
  ],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    checkDishes,
    create,
  ],
  destroy: [findOrders, isPending, destroy],
};
