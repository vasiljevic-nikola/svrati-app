import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

type ReminderLocation = {
  latitude: number;
  longitude: number;
};

type Reminder = {
  id: string;
  text: string;
  radius: number;
  isCompleted: boolean;
  location: ReminderLocation;
};

type ReminderFilter = "active" | "visited";

const REMINDERS_STORAGE_KEY = "svrati-reminders";
const RADIUS_OPTIONS = [100, 200, 500];

export default function HomeScreen() {
  const mapRef = useRef<MapView | null>(null);
  const triggeredReminderIds = useRef<Set<string>>(new Set());

  const [selectedLocation, setSelectedLocation] =
    useState<ReminderLocation | null>(null);

  const [userLocation, setUserLocation] = useState<ReminderLocation | null>(
    null,
  );

  const [locationError, setLocationError] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [reminderText, setReminderText] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(200);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(
    null,
  );

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedFilter, setSelectedFilter] =
    useState<ReminderFilter>("active");

  useEffect(() => {
    loadSavedReminders();
    setupLocationTracking();
  }, []);

  useEffect(() => {
    if (userLocation) {
      checkNearbyReminders(userLocation);
    }
  }, [userLocation, reminders]);

  const loadSavedReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);

      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders);

        const normalizedReminders = parsedReminders.map(
          (reminder: Reminder) => ({
            ...reminder,
            isCompleted: reminder.isCompleted ?? false,
          }),
        );

        setReminders(normalizedReminders);
      }
    } catch (error) {
      console.log("Failed to load reminders:", error);
    }
  };

  const saveRemindersToStorage = async (updatedReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem(
        REMINDERS_STORAGE_KEY,
        JSON.stringify(updatedReminders),
      );
    } catch (error) {
      console.log("Failed to save reminders:", error);
    }
  };

  const setupLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setLocationError("Location permission was denied.");
      return;
    }

    const currentPosition = await Location.getCurrentPositionAsync({});

    const currentLocation = {
      latitude: currentPosition.coords.latitude,
      longitude: currentPosition.coords.longitude,
    };

    setUserLocation(currentLocation);

    mapRef.current?.animateToRegion(
      {
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    );

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 25,
      },
      (location) => {
        const updatedLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(updatedLocation);
      },
    );
  };

  const checkNearbyReminders = (currentLocation: ReminderLocation) => {
    reminders.forEach((reminder) => {
      if (reminder.isCompleted) {
        return;
      }

      const distance = getDistanceInMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        reminder.location.latitude,
        reminder.location.longitude,
      );

      const alreadyTriggered = triggeredReminderIds.current.has(reminder.id);

      if (distance <= reminder.radius && !alreadyTriggered) {
        triggeredReminderIds.current.add(reminder.id);

        Alert.alert(
          "Nearby reminder",
          `You are ${Math.round(distance)}m away from: ${reminder.text}`,
        );
      }
    });
  };

  const getDistanceInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude,
      longitude,
    });

    setReminderText("");
    setSelectedRadius(200);
    setEditingReminderId(null);
    setIsModalVisible(true);
  };

  const handleSaveReminder = () => {
    if (reminderText.trim() === "") {
      return;
    }

    if (editingReminderId) {
      const updatedReminders = reminders.map((reminder) => {
        if (reminder.id !== editingReminderId) {
          return reminder;
        }

        return {
          ...reminder,
          text: reminderText.trim(),
          radius: selectedRadius,
        };
      });

      setReminders(updatedReminders);
      saveRemindersToStorage(updatedReminders);
      triggeredReminderIds.current.delete(editingReminderId);
      resetReminderForm();
      return;
    }

    if (!selectedLocation) {
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: reminderText.trim(),
      radius: selectedRadius,
      isCompleted: false,
      location: selectedLocation,
    };

    const updatedReminders = [...reminders, newReminder];

    setReminders(updatedReminders);
    saveRemindersToStorage(updatedReminders);
    setSelectedFilter("active");

    resetReminderForm();
  };

  const resetReminderForm = () => {
    setReminderText("");
    setSelectedRadius(200);
    setEditingReminderId(null);
    setIsModalVisible(false);
    setSelectedLocation(null);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminderId(reminder.id);
    setReminderText(reminder.text);
    setSelectedRadius(reminder.radius);
    setSelectedLocation(null);
    setIsModalVisible(true);
  };

  const handleDeleteReminder = (id: string) => {
    const updatedReminders = reminders.filter((reminder) => reminder.id !== id);

    triggeredReminderIds.current.delete(id);

    setReminders(updatedReminders);
    saveRemindersToStorage(updatedReminders);
  };

  const handleToggleReminderCompleted = (id: string) => {
    const updatedReminders = reminders.map((reminder) => {
      if (reminder.id !== id) {
        return reminder;
      }

      return {
        ...reminder,
        isCompleted: !reminder.isCompleted,
      };
    });

    triggeredReminderIds.current.delete(id);

    setReminders(updatedReminders);
    saveRemindersToStorage(updatedReminders);
  };

  const focusReminderOnMap = (location: ReminderLocation) => {
    mapRef.current?.animateToRegion(
      {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    );
  };

  const centerMapOnUserLocation = () => {
    if (!userLocation) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    );
  };

  const activeReminders = reminders.filter((reminder) => !reminder.isCompleted);

  const visitedReminders = reminders.filter((reminder) => reminder.isCompleted);

  const filteredReminders =
    selectedFilter === "active" ? activeReminders : visitedReminders;

  const modalTitle = editingReminderId
    ? "Edit reminder"
    : "Why do you want to come here?";

  const saveButtonLabel = editingReminderId ? "Save Changes" : "Save Reminder";

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 44.7866,
          longitude: 20.4489,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Your current location"
            pinColor="green"
          />
        )}

        {reminders.map((reminder) => (
          <Marker
            key={reminder.id}
            coordinate={reminder.location}
            title={reminder.text}
            description={
              reminder.isCompleted
                ? "Visited reminder"
                : `Reminder radius: ${reminder.radius}m`
            }
            pinColor={reminder.isCompleted ? "gray" : "red"}
          />
        ))}

        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Selected location"
            description="This location is not saved yet"
            pinColor="blue"
          />
        )}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.title}>Svrati</Text>

        <Text style={styles.subtitle}>
          Active: {activeReminders.length} | Visited: {visitedReminders.length}
        </Text>

        {locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : null}
      </View>

      <Pressable
        style={styles.locationButton}
        onPress={centerMapOnUserLocation}
      >
        <Text style={styles.locationButtonText}>My location</Text>
      </Pressable>

      <View style={styles.remindersPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Reminders</Text>

          <View style={styles.filterContainer}>
            <Pressable
              style={[
                styles.filterButton,
                selectedFilter === "active" && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter("active")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === "active" && styles.filterButtonTextActive,
                ]}
              >
                Active
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterButton,
                selectedFilter === "visited" && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter("visited")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === "visited" && styles.filterButtonTextActive,
                ]}
              >
                Visited
              </Text>
            </Pressable>
          </View>
        </View>

        {filteredReminders.length === 0 ? (
          <Text style={styles.emptyText}>
            {selectedFilter === "active"
              ? "No active reminders. Tap the map to add one."
              : "No visited reminders yet."}
          </Text>
        ) : (
          <FlatList
            data={filteredReminders}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.reminderCard,
                  item.isCompleted && styles.reminderCardCompleted,
                ]}
                onPress={() => focusReminderOnMap(item.location)}
              >
                <Text
                  style={[
                    styles.reminderText,
                    item.isCompleted && styles.reminderTextCompleted,
                  ]}
                >
                  {item.text}
                </Text>

                <Text style={styles.radiusText}>Radius: {item.radius}m</Text>

                <Text style={styles.coordinatesText}>
                  {item.location.latitude.toFixed(4)},{" "}
                  {item.location.longitude.toFixed(4)}
                </Text>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.doneButton}
                    onPress={() => handleToggleReminderCompleted(item.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {item.isCompleted ? "Undo" : "Done"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.editButton}
                    onPress={() => handleEditReminder(item)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReminder(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Buy coffee, visit shop..."
              placeholderTextColor="#94A3B8"
              value={reminderText}
              onChangeText={setReminderText}
            />

            <Text style={styles.radiusLabel}>Select reminder radius</Text>

            <View style={styles.radiusButtonsContainer}>
              {RADIUS_OPTIONS.map((radius) => (
                <Pressable
                  key={radius}
                  style={[
                    styles.radiusButton,
                    selectedRadius === radius && styles.radiusButtonActive,
                  ]}
                  onPress={() => setSelectedRadius(radius)}
                >
                  <Text
                    style={[
                      styles.radiusButtonText,
                      selectedRadius === radius &&
                        styles.radiusButtonTextActive,
                    ]}
                  >
                    {radius}m
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.saveButton} onPress={handleSaveReminder}>
              <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={resetReminderForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  header: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 20,
    borderRadius: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    color: "#CBD5E1",
    fontSize: 15,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    marginTop: 8,
  },

  locationButton: {
    position: "absolute",
    right: 20,
    top: 185,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  locationButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },

  remindersPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderRadius: 22,
  },

  panelHeader: {
    marginBottom: 12,
  },

  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },

  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },

  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  filterButtonActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },

  filterButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },

  filterButtonTextActive: {
    color: "#FFFFFF",
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },

  reminderCard: {
    width: 260,
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 16,
    marginRight: 12,
  },

  reminderCardCompleted: {
    backgroundColor: "#E2E8F0",
  },

  reminderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },

  reminderTextCompleted: {
    color: "#64748B",
    textDecorationLine: "line-through",
  },

  radiusText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
    marginBottom: 6,
  },

  coordinatesText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14,
  },

  cardActions: {
    flexDirection: "row",
    gap: 8,
  },

  doneButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  editButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 20,
  },

  radiusLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },

  radiusButtonsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  radiusButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  radiusButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },

  radiusButtonText: {
    color: "#0F172A",
    fontWeight: "600",
  },

  radiusButtonTextActive: {
    color: "#FFFFFF",
  },

  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
});
