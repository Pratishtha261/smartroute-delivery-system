const Delivery = require('../models/Delivery');
const Partner = require('../models/Partner');
const calculateHaversineDistance = require('../utils/haversineDistance');
const generateOptimizedRoute = require('../utils/routeOptimizer');
const mongoose = require('mongoose');

exports.createDelivery = async (req, res) => {
  try {
    const {
      customerId,
      pickupLocation,
      dropLocations,
      priority,
    } = req.body;

    if (!pickupLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup location is required',
      });
    }

    if (!dropLocations || !Array.isArray(dropLocations) || dropLocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one drop location is required',
      });
    }

    if (typeof pickupLocation.latitude !== 'number' || typeof pickupLocation.longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup location coordinates',
      });
    }

    for (let i = 0; i < dropLocations.length; i++) {
      const drop = dropLocations[i];
      if (typeof drop.latitude !== 'number' || typeof drop.longitude !== 'number') {
        return res.status(400).json({
          success: false,
          message: `Invalid drop location ${i + 1} coordinates`,
        });
      }

    }

    const newDelivery = new Delivery({
      customerId: customerId || null,
      pickupLocation: {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        address: pickupLocation.address || `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`,
      },
      dropLocations: dropLocations.map((drop) => ({
        latitude: drop.latitude,
        longitude: drop.longitude,
        address: drop.address || `${drop.latitude.toFixed(4)}, ${drop.longitude.toFixed(4)}`,
        customerId: drop.customerId || null,
      })),
      priority: priority || 'medium',
      status: 'pending',
    });

    await newDelivery.save();

    const availablePartners = await Partner.find({ isAvailable: true });
    let nearestPartner = null;
    let shortestDistance = Infinity;

    for (let partner of availablePartners) {
      if (partner.currentLocation && partner.currentLocation.latitude && partner.currentLocation.longitude) {
        const distance = calculateHaversineDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          partner.currentLocation.latitude,
          partner.currentLocation.longitude
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestPartner = partner;
        }
      }
    }

    if (nearestPartner) {
      newDelivery.assignedPartnerId = nearestPartner._id;
      newDelivery.status = 'assigned';
      await newDelivery.save();

      nearestPartner.isAvailable = false;
      if (!nearestPartner.assignedDeliveryIds) {
        nearestPartner.assignedDeliveryIds = [];
      }
      nearestPartner.assignedDeliveryIds.push(newDelivery._id);
      await nearestPartner.save();
    }

    res.status(201).json({
      success: true,
      message: nearestPartner ? 'Delivery created and partner auto-assigned' : 'Delivery created (no partners available)',
      data: newDelivery,
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating delivery',
      error: error.message,
    });
  }
};

exports.assignPartner = async (req, res) => {
  try {
    const { deliveryId } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const partners = await Partner.find();
    const availablePartners = partners.filter((p) => {
      const activeCount = Array.isArray(p.assignedDeliveryIds) ? p.assignedDeliveryIds.length : 0;
      return activeCount < (p.maxActiveDeliveries || 1);
    });

    if (availablePartners.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available partners',
      });
    }

    const isHighPriority = delivery.priority === 'high';

    let nearestPartner = null;
    let minDistance = Infinity;

    for (const partner of availablePartners) {
      const distance = calculateHaversineDistance(
        delivery.pickupLocation.latitude,
        delivery.pickupLocation.longitude,
        partner.currentLocation.latitude,
        partner.currentLocation.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPartner = partner;
      }
    }

    if (!nearestPartner) {
      return res.status(400).json({
        success: false,
        message: 'Could not find nearest partner',
      });
    }

    delivery.assignedPartnerId = nearestPartner._id;
    delivery.status = 'assigned';

    const baseTime = minDistance * 5; 
    const priorityMultiplier = isHighPriority ? 0.8 : 1.0; 
    const estimatedMinutes = Math.round(baseTime * priorityMultiplier);
    delivery.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60000);

    const route = generateOptimizedRoute(
      delivery.pickupLocation,
      delivery.dropLocations
    );
    delivery.route = route;

    await delivery.save();

    if (!Array.isArray(nearestPartner.assignedDeliveryIds)) {
      nearestPartner.assignedDeliveryIds = [];
    }
    if (!nearestPartner.assignedDeliveryIds.find((id) => id.toString() === deliveryId)) {
      nearestPartner.assignedDeliveryIds.push(deliveryId);
    }
    nearestPartner.assignedDeliveryId = deliveryId;
    const activeCount = nearestPartner.assignedDeliveryIds.length;
    nearestPartner.isAvailable = activeCount < (nearestPartner.maxActiveDeliveries || 1);
    await nearestPartner.save();

    res.status(200).json({
      success: true,
      message: `Partner assigned successfully (Priority: ${delivery.priority.toUpperCase()})`,
      data: {
        delivery,
        assignedPartner: nearestPartner,
        distance: `${minDistance.toFixed(2)} km`,
        priority: delivery.priority,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning partner',
      error: error.message,
    });
  }
};

exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate('assignedPartnerId', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries',
      error: error.message,
    });
  }
};

exports.getMyDeliveries = async (req, res) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer not linked to user' });
    }

    const deliveries = await Delivery.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching customer deliveries', error: error.message });
  }
};

exports.getDeliveryRoute = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = req.delivery
      ? req.delivery
      : await Delivery.findById(deliveryId).populate(
          'assignedPartnerId',
          'name currentLocation'
        );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        deliveryId: delivery._id,
        route: delivery.route,
        assignedPartner: delivery.assignedPartnerId,
        status: delivery.status,
        trackingHistory: delivery.trackingHistory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message,
    });
  }
};

exports.trackDelivery = async (req, res) => {
  try {
    const { deliveryId, latitude, longitude, status } = req.body;

    if (!deliveryId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'deliveryId, latitude, and longitude are required',
      });
    }

    const delivery = req.delivery || (await Delivery.findById(deliveryId));
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    delivery.trackingHistory.push({
      latitude,
      longitude,
      status: status || delivery.status,
      timestamp: new Date(),
    });

    if (status) {
      delivery.status = status;
    }

    if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
    }

    await delivery.save();

    if (delivery.assignedPartnerId) {
      const partner = await Partner.findById(delivery.assignedPartnerId);
      if (partner) {
        partner.currentLocation = { latitude, longitude };
        if (status === 'delivered') {
          partner.assignedDeliveryIds = (partner.assignedDeliveryIds || []).filter(
            (id) => id.toString() !== delivery._id.toString()
          );
          const activeCount = partner.assignedDeliveryIds.length;
          partner.isAvailable = activeCount < (partner.maxActiveDeliveries || 1);
        }
        await partner.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tracking update received',
      data: {
        deliveryId: delivery._id,
        status: delivery.status,
        location: { latitude, longitude },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking delivery',
      error: error.message,
    });
  }
};

exports.getDeliveryById = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = req.delivery
      ? req.delivery
      : await Delivery.findById(deliveryId).populate(
          'assignedPartnerId',
          'name email phoneNumber currentLocation'
        );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery',
      error: error.message,
    });
  }
};

exports.publicTrackDelivery = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Delivery ID' });
    }

    const delivery = await Delivery.findById(req.params.id).populate(
      'assignedPartnerId',
      'name email phoneNumber currentLocation'
    ).lean();

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const bidirectionalDijkstra = require('../utils/bidirectionalDijkstra');
    let navigationPath = [];
    const pickup = delivery.pickupLocation;
    const drops = delivery.dropLocations || [];
    
    let waypoints = [pickup, ...drops];
    
    for(let i=0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i+1];
        const { path } = bidirectionalDijkstra(start.latitude, start.longitude, end.latitude, end.longitude);
        if (i === 0) {
            navigationPath = path;
        } else {
            navigationPath = navigationPath.concat(path.slice(1));
        }
    }
    
    delivery.navigationPath = navigationPath;

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getPendingByPriority = async (req, res) => {
  try {
    
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    
    const deliveries = await Delivery.find({ status: 'pending' })
      .populate('assignedPartnerId', 'name email phoneNumber currentLocation')
      .lean();

    deliveries.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
      summary: {
        high: deliveries.filter(d => d.priority === 'high').length,
        medium: deliveries.filter(d => d.priority === 'medium').length,
        low: deliveries.filter(d => d.priority === 'low').length,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending deliveries',
      error: error.message,
    });
  }
};

exports.getPrioritySummary = async (req, res) => {
  try {
    const deliveries = await Delivery.find().lean();

    const summary = {
      total: deliveries.length,
      byStatus: {},
      byPriority: {
        high: { total: 0, pending: 0, assigned: 0, inTransit: 0, delivered: 0 },
        medium: { total: 0, pending: 0, assigned: 0, inTransit: 0, delivered: 0 },
        low: { total: 0, pending: 0, assigned: 0, inTransit: 0, delivered: 0 },
      }
    };

    deliveries.forEach(delivery => {
      const priority = delivery.priority || 'medium';
      const status = delivery.status || 'pending';

      summary.byPriority[priority].total++;

      if (status === 'pending') summary.byPriority[priority].pending++;
      if (status === 'assigned') summary.byPriority[priority].assigned++;
      if (status === 'in_transit') summary.byPriority[priority].inTransit++;
      if (status === 'delivered') summary.byPriority[priority].delivered++;

      if (!summary.byStatus[status]) summary.byStatus[status] = 0;
      summary.byStatus[status]++;
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching priority summary',
      error: error.message,
    });
  }
};

exports.emergencyAssignAll = async (req, res) => {
  try {
    
    const pendingDeliveries = await Delivery.find({
      status: 'pending',
    }).sort({ createdAt: 1 });

    if (pendingDeliveries.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending deliveries',
        assigned: 0,
      });
    }

    const priorityRank = { high: 0, medium: 1, low: 2 };
    const priorityDistanceWeight = { high: 0.7, medium: 1.0, low: 1.3 };
    pendingDeliveries.sort((a, b) => {
      const ra = priorityRank[a.priority] ?? 1;
      const rb = priorityRank[b.priority] ?? 1;
      if (ra !== rb) return ra - rb;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const assignmentResults = [];
    const partners = await Partner.find();

    for (const delivery of pendingDeliveries) {
      
      const available = partners.filter(p => {
        const activeCount = Array.isArray(p.assignedDeliveryIds) ? p.assignedDeliveryIds.length : 0;
        return activeCount < (p.maxActiveDeliveries || 1);
      });

      if (available.length === 0) {
        assignmentResults.push({
          deliveryId: delivery._id,
          status: 'failed',
          reason: 'No available partners',
        });
        continue;
      }

      const weight = priorityDistanceWeight[delivery.priority] ?? 1.0;
      let chosen = available[0];
      let minScore = Infinity;
      let chosenDist = Infinity;

      for (const partner of available) {
        const dist = calculateHaversineDistance(
          delivery.pickupLocation.latitude,
          delivery.pickupLocation.longitude,
          partner.currentLocation.latitude,
          partner.currentLocation.longitude
        );
        const score = dist * weight;
        if (score < minScore || (score === minScore && dist < chosenDist)) {
          minScore = score;
          chosenDist = dist;
          chosen = partner;
        }
      }

      delivery.assignedPartnerId = chosen._id;
      delivery.status = 'assigned';

      const route = generateOptimizedRoute(
        delivery.pickupLocation,
        delivery.dropLocations
      );
      delivery.route = route;
      await delivery.save();

      if (!Array.isArray(chosen.assignedDeliveryIds)) chosen.assignedDeliveryIds = [];
      if (!chosen.assignedDeliveryIds.find(id => id.toString() === delivery._id.toString())) {
        chosen.assignedDeliveryIds.push(delivery._id);
      }
      const activeCount = chosen.assignedDeliveryIds.length;
      chosen.isAvailable = activeCount < (chosen.maxActiveDeliveries || 1);
      await chosen.save();

      assignmentResults.push({
        deliveryId: delivery._id,
        status: 'assigned',
        priority: delivery.priority,
        partner: chosen.name,
        distance: `${chosenDist.toFixed(2)} km`,
        score: Number(minScore.toFixed(3)),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency assignment completed',
      totalDeliveries: pendingDeliveries.length,
      assigned: assignmentResults.filter(r => r.status === 'assigned').length,
      results: assignmentResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in emergency assignment',
      error: error.message,
    });
  }
};

exports.optimizeDeliveryRoute = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { algorithm = 'astar' } = req.query; 

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const AStarAlgorithm = require('../utils/astarAlgorithm');
    const BidirectionalDijkstra = require('../utils/bidirectionalDijkstra');
    const GraphBuilder = require('../utils/graphBuilder');

    const stops = [
      delivery.pickupLocation,
      ...delivery.dropLocations,
    ];

    if (stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 stops required for optimization',
      });
    }

    const completeRoute = [];
    let totalDistance = 0;
    const segmentResults = [];
    const startTime = Date.now();

    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];

      const graph = GraphBuilder.generateGraph(
        fromStop.latitude,
        fromStop.longitude,
        toStop.latitude,
        toStop.longitude,
        6
      );

      let result;
      if (algorithm === 'astar') {
        result = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
      } else if (algorithm === 'bidirectional') {
        result = BidirectionalDijkstra.findPath(graph, graph.startId, graph.endId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid algorithm. Choose: astar or bidirectional',
        });
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: `Failed to compute segment ${i + 1}`,
          error: result.error,
        });
      }

      const segmentPath = result.path;
      if (completeRoute.length === 0) {
        completeRoute.push(...segmentPath);
      } else {
        completeRoute.push(...segmentPath.slice(1));
      }

      totalDistance += result.distance;
      segmentResults.push({
        from: i === 0 ? 'pickup' : `drop_${i}`,
        to: i === stops.length - 2 ? 'final_drop' : `drop_${i + 1}`,
        distance: parseFloat(result.distance.toFixed(2)),
        estimatedTime: result.estimatedTime,
        algorithm: result.algorithm,
        nodesExplored: result.stats ? result.stats.nodesExpanded || result.stats.totalNodesVisited : 0,
      });
    }

    const executionTime = Date.now() - startTime;
    const estimatedTotalTime = Math.round(totalDistance * 5); 

    res.json({
      success: true,
      data: {
        deliveryId: delivery._id,
        algorithm,
        route: completeRoute,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        estimatedTotalTime,
        segments: segmentResults,
        executionTime,
        pickupLocation: delivery.pickupLocation,
        dropLocations: delivery.dropLocations,
      },
    });
  } catch (error) {
    console.error('Error optimizing delivery route:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing route',
      error: error.message,
    });
  }
};

exports.compareRoutingAlgorithms = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const AStarAlgorithm = require('../utils/astarAlgorithm');
    const BidirectionalDijkstra = require('../utils/bidirectionalDijkstra');
    const GraphBuilder = require('../utils/graphBuilder');

    const stops = [delivery.pickupLocation, ...delivery.dropLocations];

    if (stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 stops required',
      });
    }

    const comparisonData = [];
    let totalAStarDistance = 0;
    let totalDijkstraDistance = 0;
    let totalAStarTime = 0;
    let totalDijkstraTime = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];

      const graph = GraphBuilder.generateGraph(
        fromStop.latitude,
        fromStop.longitude,
        toStop.latitude,
        toStop.longitude,
        6
      );

      const astarResult = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
      const dijkstraResult = BidirectionalDijkstra.findPath(graph, graph.startId, graph.endId);

      if (!astarResult.success || !dijkstraResult.success) {
        return res.status(500).json({
          success: false,
          message: `Failed to compute segment ${i + 1}`,
        });
      }

      totalAStarDistance += astarResult.distance;
      totalDijkstraDistance += dijkstraResult.distance;
      totalAStarTime += astarResult.executionTime;
      totalDijkstraTime += dijkstraResult.executionTime;

      comparisonData.push({
        segment: i + 1,
        astar: {
          distance: parseFloat(astarResult.distance.toFixed(2)),
          time: astarResult.executionTime,
          nodesExplored: astarResult.stats.nodesExpanded,
        },
        dijkstra: {
          distance: parseFloat(dijkstraResult.distance.toFixed(2)),
          time: dijkstraResult.executionTime,
          nodesExplored: dijkstraResult.stats.totalNodesVisited,
        },
      });
    }

    const recommendation =
      totalAStarTime < totalDijkstraTime
        ? {
            recommended: 'A*',
            reason: `A* is ${(totalDijkstraTime / totalAStarTime).toFixed(2)}x faster`,
            speedup: (totalDijkstraTime / totalAStarTime).toFixed(2),
          }
        : {
            recommended: 'Bidirectional Dijkstra',
            reason: `Bidirectional is ${(totalAStarTime / totalDijkstraTime).toFixed(2)}x faster`,
            speedup: (totalAStarTime / totalDijkstraTime).toFixed(2),
          };

    res.json({
      success: true,
      data: {
        deliveryId: delivery._id,
        segments: comparisonData,
        totals: {
          astar: {
            distance: parseFloat(totalAStarDistance.toFixed(2)),
            executionTime: totalAStarTime,
          },
          dijkstra: {
            distance: parseFloat(totalDijkstraDistance.toFixed(2)),
            executionTime: totalDijkstraTime,
          },
        },
        recommendation,
      },
    });
  } catch (error) {
    console.error('Error comparing algorithms:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing algorithms',
      error: error.message,
    });
  }
};
