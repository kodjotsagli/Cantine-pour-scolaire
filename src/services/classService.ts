import { db } from '../db';
import type { ClassRoom } from '../types';
import { DEFAULT_CLASSES } from '../db/initialData';

export async function getActiveClasses(): Promise<ClassRoom[]> {
  try {
    let classes = await db.classes.toArray();
    if (classes.length === 0) {
      await db.classes.bulkAdd(DEFAULT_CLASSES);
      classes = await db.classes.toArray();
    }
    return classes.filter(c => c.active !== false);
  } catch (error) {
    console.error('Erreur lors du chargement des classes :', error);
    return DEFAULT_CLASSES;
  }
}

export async function getAllClasses(): Promise<ClassRoom[]> {
  try {
    let classes = await db.classes.toArray();
    if (classes.length === 0) {
      await db.classes.bulkAdd(DEFAULT_CLASSES);
      classes = await db.classes.toArray();
    }
    return classes;
  } catch (error) {
    console.error('Erreur lors du chargement de toutes les classes :', error);
    return DEFAULT_CLASSES;
  }
}
