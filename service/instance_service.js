/*
 * @Author: Copyright(c) 2020 Suwings
 * @Date: 2020-11-23 17:45:02
 * @LastEditTime: 2021-03-28 10:32:41
 * @Description: 
 * @Projcet: MCSManager Daemon
 * @License: MIT
 */
// eslint-disable-next-line no-unused-vars
const { Instance } = require("../entity/instance");
const { EventEmitter } = require("events");
const fs = require("fs-extra");
const path = require("path")

class InstanceService extends EventEmitter {
  constructor() {
    super();
    this.instances = {};
  }

  /**
   * 装载所有实例应用
   * @return {void}
   */
  loadInstances(dir) {
    const files = fs.readdirSync(dir);
    for (const fileName of files) {
      if (path.extname(fileName) !== ".json") continue;
      const instance = new Instance(fileName.split(".")[0]);
      this.addInstance(instance);
    }
  }

  /**
   * @param {Instance} instance
   */
  addInstance(instance) {
    if (this.instances[instance.instanceUUID]) {
      throw new Error(`应用实例 ${instance.instanceUUID} 已经存在.`);
    }
    this.instances[instance.instanceUUID] = instance;
    // 动态监听新增的实例输出流，传递给自身事件流
    instance.on("data", (...arr) => {
      this.emit("data", instance.instanceUUID, ...arr);
    });
    instance.on("exit", (...arr) => {
      this.emit("exit", instance.instanceUUID, ...arr);
    });
    instance.on("open", (...arr) => {
      this.emit("open", instance.instanceUUID, ...arr);
    });
  }

  /**
   * @param {string} instanceUUID
   */
  removeInstance(instanceUUID) {
    const instance = this.getInstance(instanceUUID);
    if (instance) instance.destroy();
    delete this.instances[instanceUUID];
    return true;
  }

  /**
   * @param {string} instanceUUID
   * @return {Instance}
   */
  getInstance(instanceUUID) {
    return this.instances[instanceUUID];
  }

  exists(instanceUUID) {
    return this.instances[instanceUUID] ? true : false;
  }

  /**
   * @return {{string:Instance}}
   */
  getAllInstance() {
    return this.instances;
  }

  /**
   * @return {Number}
   */
  getInstancesSize() {
    let i = 0;
    // eslint-disable-next-line no-unused-vars
    for (const _key in this.instances) i++;
    return i;
  }
}

module.exports.instanceService = new InstanceService();
