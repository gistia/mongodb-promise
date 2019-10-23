const { ObjectID } = require('mongodb');

const fixId = (data) => {
  if (data._id) {
    try {
      data._id = new ObjectID(data._id);
    } catch (e) {
      // console.warn(`Error converting ${data._id} to ObjectID`);
    }
  }

  return data;
};

module.exports = { fixId };
