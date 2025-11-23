// src/parsing/group-source.service.ts
import { Injectable } from '@nestjs/common';
import { GroupSource } from '../db/entities/groupSource.entity';

@Injectable()
export class GroupSourceService {
  /**
   * Returnează toate sursele active pentru un oraș (ex: "timisoara"),
   * ordonate după priority.
   */
  async getActiveByCitySlug(citySlug: string): Promise<GroupSource[]> {
    return GroupSource.findAll({
      where: {
        citySlug,
        isActive: true,
      },
      order: [
        ['priority', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  /**
   * Variante cu filtrare și pe gisNode (dacă vrei noduri diferite în același oraș)
   */
  async getActiveByCityAndGisNode(
    citySlug: string,
    gisNodeId: number
  ): Promise<GroupSource[]> {
    return GroupSource.findAll({
      where: {
        citySlug,
        gisNodeId,
        isActive: true,
      },
      order: [
        ['priority', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  /**
   * Returnează DOAR linkurile (string[]) pentru un oraș
   * – ideal pentru jobul de scraping.
   */
  async getActiveLinksByCity(citySlug: string): Promise<string[]> {
    const groups = await this.getActiveByCitySlug(citySlug);
    return groups.map((g) => g.url);
  }

  /**
   * Marchez că am scrapuit un grup (actualizez lastScrapedAt).
   */
  async markScraped(groupId: number) {
    await GroupSource.update(
      { lastScrapedAt: new Date() },
      { where: { id: groupId } }
    );
  }
}
